package asaas

import (
	"context"
	"fmt"
	"strings"
	"time"

	"vigi/internal/modules/client"
	"vigi/internal/modules/invoice"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Service struct {
	repo           Repository
	invoiceService *invoice.Service
	clientService  *client.Service
	logger         *zap.SugaredLogger
}

func NewService(
	repo Repository,
	invoiceService *invoice.Service,
	clientService *client.Service,
	logger *zap.SugaredLogger,
) *Service {
	return &Service{
		repo:           repo,
		invoiceService: invoiceService,
		clientService:  clientService,
		logger:         logger.Named("[asaas-service]"),
	}
}

func (s *Service) CreateConfig(ctx context.Context, organizationID uuid.UUID, dto CreateAsaasConfigDTO) (*AsaasConfig, error) {
	config := &AsaasConfig{
		OrganizationID: organizationID,
		ApiKey:         dto.ApiKey,
		Environment:    dto.Environment,
	}
	if err := s.repo.Create(ctx, config); err != nil {
		return nil, err
	}
	return config, nil
}

func (s *Service) GetConfig(ctx context.Context, organizationID uuid.UUID) (*AsaasConfig, error) {
	config, err := s.repo.GetByOrganizationID(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if config != nil {
		if config.ApiKey != "" {
			config.ApiKey = "********"
		}
	}
	return config, nil
}

func (s *Service) UpdateConfig(ctx context.Context, organizationID uuid.UUID, dto UpdateAsaasConfigDTO) (*AsaasConfig, error) {
	config, err := s.repo.GetByOrganizationID(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}

	if dto.ApiKey != nil && *dto.ApiKey != "********" {
		config.ApiKey = *dto.ApiKey
	}
	if dto.Environment != nil {
		config.Environment = *dto.Environment
	}

	if err := s.repo.Update(ctx, config); err != nil {
		return nil, err
	}

	if config.ApiKey != "" {
		config.ApiKey = "********"
	}
	return config, nil
}

func (s *Service) CreateCharge(ctx context.Context, organizationID uuid.UUID, dto GenerateChargeDTO) error {
	invoiceID, err := uuid.Parse(dto.InvoiceID)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	inv, err := s.invoiceService.GetByID(ctx, invoiceID)
	if err != nil {
		return fmt.Errorf("failed to get invoice: %w", err)
	}
	if inv == nil {
		return fmt.Errorf("invoice not found")
	}

	if inv.OrganizationID != organizationID {
		return fmt.Errorf("invoice does not belong to organization")
	}

	// 1. Get Client
	cli, err := s.clientService.GetByID(ctx, inv.ClientID)
	if err != nil {
		return fmt.Errorf("client not found: %w", err)
	}

	// 2. Get Config
	config, err := s.repo.GetByOrganizationID(ctx, organizationID)
	if err != nil || config == nil {
		return fmt.Errorf("asaas not configured")
	}

	apiClient := NewAsaasClient(config)

	// 3. Find or Create Customer
	cpfCnpj := ""
	if cli.IDNumber != nil {
		cpfCnpj = sanitizeNumeric(*cli.IDNumber)
	}
	if cpfCnpj == "" {
		return fmt.Errorf("client document (CPF/CNPJ) is required for Asaas")
	}

	customer, err := apiClient.GetCustomerByDoc(cpfCnpj)
	if err != nil {
		return fmt.Errorf("failed to fetch asaas customer: %w", err)
	}

	if customer == nil {
		// Create
		newCustomer := AsaasCustomer{
			Name:                 cli.Name,
			CpfCnpj:              cpfCnpj,
			NotificationDisabled: true, // Disable notifications by default
		}
		if len(cli.Contacts) > 0 {
			if cli.Contacts[0].Email != nil {
				newCustomer.Email = *cli.Contacts[0].Email
			}
			if cli.Contacts[0].Phone != nil {
				newCustomer.MobilePhone = sanitizeNumeric(*cli.Contacts[0].Phone)
			}
		}
		// Address... (simplified)
		if cli.Address1 != nil {
			newCustomer.Address = *cli.Address1
		}
		if cli.PostalCode != nil {
			newCustomer.PostalCode = sanitizeNumeric(*cli.PostalCode)
		}

		created, err := apiClient.CreateCustomer(newCustomer)
		if err != nil {
			return fmt.Errorf("failed to create asaas customer: %w", err)
		}
		customer = created
	}

	// 4. Create Charge
	dueDate := time.Now().AddDate(0, 0, 3)
	if inv.DueDate != nil {
		dueDate = *inv.DueDate
	}

	// Value logic: same as Inter, Asaas expects nominal value
	totalNet := float64(inv.Total)
	valorNominal := totalNet + float64(inv.Discount)

	paymentReq := AsaasPaymentRequest{
		Customer:          customer.ID,
		BillingType:       "PIX", // Use PIX
		Value:             valorNominal,
		DueDate:           dueDate.Format("2006-01-02"),
		Description:       fmt.Sprintf("Invoice #%s", inv.Number),
		ExternalReference: inv.ID.String(),
	}

	resp, err := apiClient.CreatePayment(paymentReq)
	if err != nil {
		return fmt.Errorf("failed to create asaas payment: %w", err)
	}

	// 5. Fetch QR Code for PIX
	var pixPayload *string
	pixInfo, err := apiClient.GetPixQrCode(resp.ID)
	if err != nil {
		// Log error but don't fail generic flow? Or fail?
		// If we can't get the QR code, the user can't pay via the public link PIX we wanted.
		// Let's log and proceed, but maybe we should fail.
		// For now, let's return error as this is crucial for the requirement.
		s.logger.Errorw("failed to get pix qr code", "payment_id", resp.ID, "error", err)
		// Try to continue, maybe later we can retry?
		// Actually, let's treat it as non-fatal but highly undesirable.
	} else {
		pixPayload = &pixInfo.Payload
	}

	// 6. Update Invoice
	bankStatus := "CREATED"
	updateDto := invoice.UpdateInvoiceDTO{
		BankInvoiceID:     &resp.ID,
		BankInvoiceStatus: &bankStatus,
		BankPixPayload:    pixPayload,
	}

	if _, err := s.invoiceService.Update(ctx, invoiceID, updateDto); err != nil {
		return fmt.Errorf("failed to update invoice: %w", err)
	}

	return nil
}

func sanitizeNumeric(s string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, s)
}
