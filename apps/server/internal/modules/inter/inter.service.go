package inter

import (
	"context"
	"fmt"
	"strings"
	"time"

	"vigi/internal/modules/client"
	"vigi/internal/modules/invoice"

	"github.com/google/uuid"
)

type Service struct {
	repo           Repository
	invoiceService *invoice.Service
	clientService  *client.Service
}

func NewService(
	repo Repository,
	invoiceService *invoice.Service,
	clientService *client.Service,
) *Service {
	return &Service{
		repo:           repo,
		invoiceService: invoiceService,
		clientService:  clientService,
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

	return config, nil
}

func (s *Service) GetConfig(ctx context.Context, organizationID uuid.UUID) (*InterConfig, error) {
	return s.repo.GetByOrganizationID(ctx, organizationID)
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
	if dto.Certificate != nil {
		config.Certificate = *dto.Certificate
	}
	if dto.Key != nil {
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
			p := sanitizePhone(*contact.Phone)
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
		Cep:         cep,
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
	total := float64(inv.Total)

	reqData := InterChargeRequest{
		SeuNumero:      inv.Number,
		ValorNominal:   total,
		DataVencimento: dueDate.Format("2006-01-02"),
		NumDiasAgenda:  30,
		Pagador:        payer,
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

func sanitizeCpfCnpj(s string) string {
	return strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(s, ".", ""), "-", ""), "/", "")
}

func sanitizePhone(s string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, s)
}
