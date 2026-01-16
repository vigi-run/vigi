package invoice

import (
	"context"
	"fmt"
	"strings"
	"time"
	"vigi/internal/pkg/usesend"

	"github.com/google/uuid"
)

func (s *Service) SendCreatedEmail(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeCreated, "Nova Fatura Gerada", "")
}

func (s *Service) SendFirstEmail(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeFirst, "Lembrete de Fatura", "")
}

func (s *Service) SendSecondReminder(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeSecond, "Segundo Lembrete de Fatura", "")
}

func (s *Service) SendThirdReminder(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeThird, "Último Lembrete de Fatura", "")
}

// SendManualEmail allows sending any email type with custom content
func (s *Service) SendManualEmail(ctx context.Context, id uuid.UUID, emailType InvoiceEmailType, subject string, htmlContent string) error {
	return s.sendInvoiceEmail(ctx, id, emailType, subject, htmlContent)
}

func (s *Service) PreviewEmail(ctx context.Context, id uuid.UUID, emailType InvoiceEmailType, customMessage string) (string, string, string, error) {
	invoice, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return "", "", "", err
	}
	if invoice == nil {
		return "", "", "", fmt.Errorf("invoice not found")
	}

	org, err := s.orgRepo.FindByID(ctx, invoice.OrganizationID.String())
	if err != nil {
		return "", "", "", fmt.Errorf("failed to fetch organization: %w", err)
	}

	var subject string
	var messageBody string

	// If customMessage provided, use it
	if customMessage != "" {
		messageBody = customMessage
	} else {
		// Default messages key off type
		switch emailType {
		case InvoiceEmailTypeCreated:
			messageBody = "<p>Uma nova fatura foi gerada para sua organização. Abaixo estão os detalhes:</p>"
		case InvoiceEmailTypeFirst:
			messageBody = "<p>Este é um lembrete sobre sua fatura em aberto. Por favor, verifique os detalhes abaixo:</p>"
		case InvoiceEmailTypeSecond:
			messageBody = "<p>Ainda não identificamos o pagamento da sua fatura. Caso já tenha efetuado, por favor desconsidere.</p>"
		case InvoiceEmailTypeThird:
			messageBody = "<p>Esta é uma última notificação sobre sua fatura pendente. Por favor, regularize o quanto antes.</p>"
		default:
			messageBody = "<p>Seguem os detalhes da sua fatura:</p>"
		}
	}

	switch emailType {
	case InvoiceEmailTypeCreated:
		subject = "Nova Fatura Gerada"
	case InvoiceEmailTypeFirst:
		subject = "Lembrete de Fatura"
	case InvoiceEmailTypeSecond:
		subject = "Segundo Lembrete de Fatura"
	case InvoiceEmailTypeThird:
		subject = "Último Lembrete de Fatura"
	default:
		subject = "Notificação de Fatura"
	}

	htmlContent := s.generateEmailBody(invoice, subject, org.Name, emailType, messageBody)
	return subject, htmlContent, messageBody, nil
}

func (s *Service) sendInvoiceEmail(ctx context.Context, id uuid.UUID, emailType InvoiceEmailType, subject string, messageBody string) error {
	invoice, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if invoice == nil {
		return fmt.Errorf("invoice not found")
	}

	org, err := s.orgRepo.FindByID(ctx, invoice.OrganizationID.String())
	if err != nil {
		return fmt.Errorf("failed to fetch organization: %w", err)
	}

	clientId := invoice.ClientID
	clientEntity, err := s.clientRepo.GetByID(ctx, clientId)
	if err != nil {
		return fmt.Errorf("failed to fetch client: %w", err)
	}
	if clientEntity == nil {
		return fmt.Errorf("client not found")
	}

	var toEmail string
	for _, contact := range clientEntity.Contacts {
		if contact.Email != nil && *contact.Email != "" {
			toEmail = *contact.Email
			break
		}
	}

	if toEmail == "" {
		return fmt.Errorf("client has no contact with email")
	}

	// Generate HTML body using messageBody as custom content if provided
	htmlContent := s.generateEmailBody(invoice, subject, org.Name, emailType, messageBody)

	req := usesend.SendEmailRequest{
		To:      toEmail,
		From:    "financeiro@codgital.com", // Reverted to verified domain
		Subject: subject,
		HTML:    htmlContent,
		Tags: map[string]string{
			"invoice_id": invoice.ID.String(),
			"type":       string(emailType),
		},
	}

	resp, err := s.usesendClient.SendEmail(ctx, req)
	if err != nil {
		fmt.Printf("Error sending email: %v\n", err)
		return err
	}

	emailRecord := &InvoiceEmail{
		ID:        uuid.New().String(),
		InvoiceID: invoice.ID.String(),
		Type:      emailType,
		EmailID:   resp.EmailID,
		Status:    usesend.EmailStatusSent,
	}

	fmt.Printf("Saving email record: %+v\n", emailRecord)
	return s.emailRepo.Create(ctx, emailRecord)
}

func (s *Service) generateEmailBody(invoice *Invoice, subject string, orgName string, emailType InvoiceEmailType, customMessage string) string {
	publicLink := fmt.Sprintf("%s/portal-client/org/%s", s.cfg.ClientURL, invoice.ID)

	// Format currency
	totalFormatted := fmt.Sprintf("R$ %.2f", float64(invoice.Total))
	totalFormatted = strings.Replace(totalFormatted, ".", ",", 1)
	dueDate := invoice.DueDate.Format("02/01/2006")

	var messageBody string
	if customMessage != "" {
		messageBody = customMessage
	} else {
		switch emailType {
		case InvoiceEmailTypeCreated:
			messageBody = "<p>Uma nova fatura foi gerada para sua organização. Abaixo estão os detalhes:</p>"
		case InvoiceEmailTypeFirst:
			messageBody = "<p>Este é um lembrete sobre sua fatura em aberto. Por favor, verifique os detalhes abaixo:</p>"
		case InvoiceEmailTypeSecond:
			messageBody = "<p>Ainda não identificamos o pagamento da sua fatura. Caso já tenha efetuado, por favor desconsidere.</p>"
		case InvoiceEmailTypeThird:
			messageBody = "<p>Esta é uma última notificação sobre sua fatura pendente. Por favor, regularize o quanto antes.</p>"
		default:
			messageBody = "<p>Seguem os detalhes da sua fatura:</p>"
		}
	}

	// Ensure messageBody is wrapped if it's plain text (legacy safety)
	if !strings.HasPrefix(messageBody, "<") {
		messageBody = fmt.Sprintf("<p>%s</p>", messageBody)
	}

	return fmt.Sprintf(`
<h3>%s</h3>
%s
<p>
	<strong>Fatura #%s</strong><br>
	Valor: %s<br>
	Vencimento: %s
</p>
<p>
	<a href="%s" style="background-color:#007bff;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Visualizar Fatura</a>
</p>
<p>
	<small>Link público: %s</small>
</p>
<hr>
<p>
	<small>&copy; %d %s. Todos os direitos reservados.</small>
</p>
	`, orgName, messageBody, invoice.Number, totalFormatted, dueDate, publicLink, publicLink, time.Now().Year(), orgName)
}

func (s *Service) GetEmailHistory(ctx context.Context, id uuid.UUID) ([]*InvoiceEmail, error) {
	return s.emailRepo.GetByInvoiceID(ctx, id.String())
}
