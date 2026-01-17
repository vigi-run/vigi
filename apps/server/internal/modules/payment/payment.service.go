package payment

import (
	"context"
	"fmt"

	"vigi/internal/modules/asaas"
	"vigi/internal/modules/inter"
	"vigi/internal/modules/invoice"
	"vigi/internal/modules/organization"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Service struct {
	orgRepo        organization.OrganizationRepository
	invoiceService *invoice.Service
	interService   *inter.Service
	asaasService   *asaas.Service
	logger         *zap.SugaredLogger
}

func NewService(
	orgRepo organization.OrganizationRepository,
	invoiceService *invoice.Service,
	interService *inter.Service,
	asaasService *asaas.Service,
	logger *zap.SugaredLogger,
) *Service {
	return &Service{
		orgRepo:        orgRepo,
		invoiceService: invoiceService,
		interService:   interService,
		asaasService:   asaasService,
		logger:         logger.Named("[payment-service]"),
	}
}

func (s *Service) GenerateCharge(ctx context.Context, orgID uuid.UUID, invoiceID string) error {
	invUUID, err := uuid.Parse(invoiceID)
	if err != nil {
		return fmt.Errorf("invalid invoice id: %w", err)
	}

	// 1. Get Organization to check bank provider
	org, err := s.orgRepo.FindByID(ctx, orgID.String())
	if err != nil {
		return fmt.Errorf("failed to get organization: %w", err)
	}
	if org == nil {
		return fmt.Errorf("organization not found")
	}

	provider := ""
	if org.BankProvider != nil {
		provider = *org.BankProvider
	}

	if provider == "" {
		return fmt.Errorf("bank provider not configured for organization")
	}

	s.logger.Infow("Generating charge", "invoice_id", invoiceID, "provider", provider)

	// 2. Dispatch to provider service
	switch provider {
	case "inter":
		dto := inter.GenerateChargeDTO{InvoiceID: invoiceID}
		if err := s.interService.CreateCharge(ctx, orgID, dto); err != nil {
			return err
		}
	case "asaas":
		dto := asaas.GenerateChargeDTO{InvoiceID: invoiceID}
		if err := s.asaasService.CreateCharge(ctx, orgID, dto); err != nil {
			return err
		}
	default:
		return fmt.Errorf("unsupported bank provider: %s", provider)
	}

	// 3. Update Invoice with BankProvider
	// Note: The specific services (inter/asaas) already update the invoice with bank_id and status.
	// We just need to add the provider name.
	// We can update it now.

	updateDto := invoice.UpdateInvoiceDTO{
		BankProvider: &provider,
	}
	// Note: UpdateInvoiceDTO needs to have BankProvider field added first!
	// I'll check/add it.

	if _, err := s.invoiceService.Update(ctx, invUUID, updateDto); err != nil {
		s.logger.Errorw("Failed to update invoice bank provider", "error", err)
		// Don't fail the whole request since charge was generated
	}

	return nil
}
