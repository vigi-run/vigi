package inter

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"vigi/internal/config"
	"vigi/internal/modules/client"
	"vigi/internal/modules/invoice"

	"github.com/google/uuid"
)

type Service struct {
	repo           Repository
	webhookRepo    WebhookRepository
	invoiceService *invoice.Service
	clientService  *client.Service
	cfg            *config.Config
}

func NewService(
	repo Repository,
	webhookRepo WebhookRepository,
	invoiceService *invoice.Service,
	clientService *client.Service,
	cfg *config.Config,
) *Service {
	return &Service{
		repo:           repo,
		webhookRepo:    webhookRepo,
		invoiceService: invoiceService,
		clientService:  clientService,
		cfg:            cfg,
	}
}

func (s *Service) CreateConfig(ctx context.Context, organizationID uuid.UUID, dto CreateInterConfigDTO) (*InterConfig, error) {
	config := &InterConfig{
		OrganizationID: organizationID,
		ClientID:       dto.ClientID,
		ClientSecret:   dto.ClientSecret,
		Certificate:    dto.Certificate,
		Key:            dto.Key,
		AccountNumber:  dto.AccountNumber,
		Environment:    dto.Environment,
	}

	if err := s.repo.Create(ctx, config); err != nil {
		return nil, err
	}

	// Try to register webhook
	if err := s.registerWebhook(config); err != nil {
		// Log error but don't fail config creation?
		// Or fail? Failing is safer to ensure it works.
		// However, development envs might fail.
		// Let's log if logging is available, or return error.
		// For now return error so user knows configuration is incomplete/invalid.
		// But if it's localhost, it WILL fail.
		// Allow failure if localhost?
		// User instructions said assume public URL.
		fmt.Printf("Warning: failed to register webhook: %v\n", err)
	}

	return config, nil
}

func (s *Service) GetConfig(ctx context.Context, organizationID uuid.UUID) (*InterConfig, error) {
	config, err := s.repo.GetByOrganizationID(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if config != nil {
		// Mask sensitive data
		if config.Certificate != "" {
			config.Certificate = "********"
		}
		if config.Key != "" {
			config.Key = "********"
		}
	}
	return config, nil
}

func (s *Service) UpdateConfig(ctx context.Context, organizationID uuid.UUID, dto UpdateInterConfigDTO) (*InterConfig, error) {
	config, err := s.repo.GetByOrganizationID(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}

	if dto.ClientID != nil {
		config.ClientID = *dto.ClientID
	}
	if dto.ClientSecret != nil {
		config.ClientSecret = *dto.ClientSecret
	}
	// Only update certificate if it's not the masked value
	if dto.Certificate != nil && *dto.Certificate != "********" {
		config.Certificate = *dto.Certificate
	}
	// Only update key if it's not the masked value
	if dto.Key != nil && *dto.Key != "********" {
		config.Key = *dto.Key
	}
	if dto.AccountNumber != nil {
		config.AccountNumber = dto.AccountNumber
	}
	if dto.Environment != nil {
		config.Environment = *dto.Environment
	}

	if err := s.repo.Update(ctx, config); err != nil {
		return nil, err
	}

	// Try to register webhook again on update
	if err := s.registerWebhook(config); err != nil {
		fmt.Printf("Warning: failed to register webhook: %v\n", err)
	}

	// Mask config before returning
	if config.Certificate != "" {
		config.Certificate = "********"
	}
	if config.Key != "" {
		config.Key = "********"
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

	// Fetch Client
	cli, err := s.clientService.GetByID(ctx, inv.ClientID)
	if err != nil {
		return fmt.Errorf("failed to get client: %w", err)
	}
	if cli == nil {
		return fmt.Errorf("client not found")
	}

	// Fetch Inter Config
	config, err := s.GetConfig(ctx, organizationID)
	if err != nil {
		return fmt.Errorf("failed to get inter config: %w", err)
	}
	if config == nil {
		return fmt.Errorf("inter integration not configured")
	}

	// Prepare Inter Client
	interClient, err := NewInterClient(config)
	if err != nil {
		return fmt.Errorf("failed to create inter client: %w", err)
	}

	// Prepare Payer
	tipoPessoa := "JURIDICA"
	if cli.Classification == client.ClientClassificationIndividual {
		tipoPessoa = "FISICA"
	}

	// Assuming IDNumber is CPF/CNPJ
	cpfCnpj := ""
	if cli.IDNumber != nil {
		cpfCnpj = sanitizeCpfCnpj(*cli.IDNumber)
	}

	// Address
	endereco := ""
	if cli.Address1 != nil {
		endereco = *cli.Address1
	}
	numero := ""
	if cli.AddressNumber != nil {
		numero = *cli.AddressNumber
	}
	complemento := ""
	if cli.Address2 != nil {
		complemento = *cli.Address2
	}
	bairro := ""
	if cli.Neighborhood != nil {
		bairro = *cli.Neighborhood
	}
	cidade := ""
	if cli.City != nil {
		cidade = *cli.City
	}
	uf := ""
	if cli.State != nil {
		uf = *cli.State
	}
	cep := ""
	if cli.PostalCode != nil {
		cep = *cli.PostalCode
	}

	// Contact info
	email := ""
	phone := ""
	ddd := ""
	if len(cli.Contacts) > 0 {
		contact := cli.Contacts[0]
		if contact.Email != nil {
			email = *contact.Email
		}
		if contact.Phone != nil {
			p := sanitizeNumeric(*contact.Phone)
			if len(p) >= 10 {
				ddd = p[:2]
				phone = p[2:]
			} else {
				phone = p
			}
		}
	}

	payer := InterPayer{
		CpfCnpj:     cpfCnpj,
		TipoPessoa:  tipoPessoa,
		Nome:        cli.Name,
		Endereco:    endereco,
		Numero:      numero,
		Complemento: complemento,
		Bairro:      bairro,
		Cidade:      cidade,
		Uf:          uf,
		Cep:         sanitizeNumeric(cep),
		Email:       email,
		Ddd:         ddd,
		Telefone:    phone,
	}

	// Invoice Data
	dueDate := time.Now().AddDate(0, 0, 3) // Default 3 days if nil
	if inv.DueDate != nil {
		dueDate = *inv.DueDate
	}

	// Value
	// The bank expects the GROSS value (Nominal) and a separate Discount object.
	// We were sending the NET value as nominal before.
	// Now we calculate gross and set discount.
	// Note: inv.Total is already net in our system if calculated properly,
	// BUT wait, inv.Total usually includes discounts in many systems.
	// Looking at invoice service create:
	// total += (qty * price) - itemDiscount
	// total -= invoiceDiscount
	// So inv.Total IS THE NET AMOUNT TO BE PAID.

	// We need to reconstruct the Gross Amount.
	// Gross = Net + Discount
	// Actually, Inter expects "Valor Nominal" which matches the face value of the boleto BEFORE discount.
	// So yes, we should add the discount back to get the nominal value.

	discountValue := float64(inv.Discount)
	// We also need to account for item level discounts if we want to show them?
	// Usually boletos have a global discount field.
	// If we have item discounts, they are already baked into the lines.
	// It's complex to extract item discounts to a global boleto discount field unless we sum them up.
	// For simplicity and correctness with current Invoice model which has a global discount field:
	// We will only use inv.Discount as the explicit boleto discount.
	// Item discounts will remain as "lower price" items.

	// So ValorNominal = inv.Total + inv.Discount
	totalNet := float64(inv.Total)
	valorNominal := totalNet + discountValue

	reqData := InterChargeRequest{
		SeuNumero:      inv.Number,
		ValorNominal:   valorNominal,
		DataVencimento: dueDate.Format("2006-01-02"),
		NumDiasAgenda:  30,
		Pagador:        payer,
	}

	if discountValue > 0 {
		reqData.Desconto = &InterDiscount{
			Codigo:         "VALORFIXODATAINFORMADA",
			QuantidadeDias: 0, // 0 means until due date
			Valor:          discountValue,
			Data:           dueDate.Format("2006-01-02"), // Discount valid until due date
		}
	}

	// Call Inter
	resp, err := interClient.CreateCharge(reqData)
	if err != nil {
		return fmt.Errorf("inter api error: %w", err)
	}

	bankInvID := resp.CodigoSolicitacao
	bankStatus := "CREATED"

	updateDto := invoice.UpdateInvoiceDTO{
		BankInvoiceID:     &bankInvID,
		BankInvoiceStatus: &bankStatus,
	}

	_, err = s.invoiceService.Update(ctx, invoiceID, updateDto)
	if err != nil {
		return fmt.Errorf("failed to update invoice with bank info: %w", err)
	}

	return nil
}

func (s *Service) registerWebhook(config *InterConfig) error {
	if s.cfg.ClientURL == "" {
		return fmt.Errorf("CLIENT_URL is not configured")
	}
	webhookUrl := s.cfg.ClientURL + "/api/v1/integrations/inter/webhook"

	client, err := NewInterClient(config)
	if err != nil {
		return err
	}

	return client.RegisterWebhook(webhookUrl)
}

func (s *Service) HandleWebhook(ctx context.Context, payload []byte) error {
	// 1. Log event
	event := &WebhookEvent{
		ID:        uuid.New(),
		Provider:  "inter",
		Payload:   string(payload),
		Processed: false,
	}
	if err := s.webhookRepo.Create(ctx, event); err != nil {
		return fmt.Errorf("failed to log webhook event: %w", err)
	}

	// 2. Parse
	var webhookEvents InterWebhookPayload
	if err := json.Unmarshal(payload, &webhookEvents); err != nil {
		errMsg := fmt.Sprintf("failed to parse payload: %v", err)
		event.Error = &errMsg
		_ = s.webhookRepo.Update(ctx, event)
		return nil // Return nil to avoid Inter retrying invalid payload
	}

	// 3. Process
	for _, item := range webhookEvents {
		// Log helpful info
		fmt.Printf("Processing Inte webhook event: %v\n", item)

		if item.Situacao == "RECEBIDO" || item.Situacao == "PAGO" {
			targetID := item.CodigoSolicitacao
			if targetID == "" {
				// Fallback to NossoNumero if CodigoSolicitacao is missing
				targetID = item.NossoNumero
			}

			if targetID == "" {
				continue
			}

			// Find invoice
			inv, err := s.invoiceService.GetByBankID(ctx, targetID)
			if err != nil {
				if err == sql.ErrNoRows {
					// Not found, maybe log?
					continue
				}
				// Other error
				errMsg := fmt.Sprintf("db error: %v", err)
				event.Error = &errMsg
				_ = s.webhookRepo.Update(ctx, event)
				return nil
			}

			if inv != nil {
				// Update event resource
				event.ResourceID = &inv.ID

				// Update Invoice Status
				status := invoice.InvoiceStatusPaid
				updateDto := invoice.UpdateInvoiceDTO{
					Status:            &status,
					BankInvoiceStatus: &item.Situacao,
				}
				_, err = s.invoiceService.Update(ctx, inv.ID, updateDto)
				if err != nil {
					errMsg := fmt.Sprintf("failed to update invoice %s: %v", inv.ID, err)
					event.Error = &errMsg
					_ = s.webhookRepo.Update(ctx, event)
					return nil
				}
			}
		} else if item.Situacao == "CANCELADO" || item.Situacao == "BAIXADO" {
			// Handle cancellation logic if needed
			// For now just update bank status
			targetID := item.CodigoSolicitacao
			if targetID == "" {
				targetID = item.NossoNumero
			}
			if targetID != "" {
				inv, err := s.invoiceService.GetByBankID(ctx, targetID)
				if err == nil && inv != nil {
					event.ResourceID = &inv.ID
					updateDto := invoice.UpdateInvoiceDTO{
						BankInvoiceStatus: &item.Situacao,
					}
					_, _ = s.invoiceService.Update(ctx, inv.ID, updateDto)
				}
			}
		}
	}

	event.Processed = true
	if err := s.webhookRepo.Update(ctx, event); err != nil {
		return fmt.Errorf("failed to update event status: %w", err)
	}

	return nil
}

func sanitizeCpfCnpj(s string) string {
	return sanitizeNumeric(s)
}

func sanitizeNumeric(s string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, s)
}
