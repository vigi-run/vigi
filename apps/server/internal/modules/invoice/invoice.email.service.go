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
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeCreated, "Nova Fatura Gerada", "", false)
}

func (s *Service) SendFirstEmail(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeFirst, "Lembrete de Fatura", "", false)
}

func (s *Service) SendSecondReminder(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeSecond, "Segundo Lembrete de Fatura", "", false)
}

func (s *Service) SendThirdReminder(ctx context.Context, id uuid.UUID) error {
	return s.sendInvoiceEmail(ctx, id, InvoiceEmailTypeThird, "Último Lembrete de Fatura", "", false)
}

// SendManualEmail allows sending any email type with custom content
func (s *Service) SendManualEmail(ctx context.Context, id uuid.UUID, emailType InvoiceEmailType, subject string, htmlContent string) error {
	return s.sendInvoiceEmail(ctx, id, emailType, subject, htmlContent, true)
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
			messageBody = "Uma nova fatura foi gerada para você. Abaixo estão os detalhes:"
		case InvoiceEmailTypeFirst:
			messageBody = "Este é um lembrete sobre sua fatura em aberto. Por favor, verifique os detalhes abaixo:"
		case InvoiceEmailTypeSecond:
			messageBody = "Ainda não identificamos o pagamento da sua fatura. Caso já tenha efetuado, por favor desconsidere."
		case InvoiceEmailTypeThird:
			messageBody = "Esta é uma última notificação sobre sua fatura pendente. Por favor, regularize o quanto antes."
		default:
			messageBody = "Seguem os detalhes da sua fatura:"
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

func (s *Service) sendInvoiceEmail(ctx context.Context, id uuid.UUID, emailType InvoiceEmailType, subject string, content string, isFullHTML bool) error {
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

	// Find contact with email
	var toEmail string
	var toName string
	for _, contact := range clientEntity.Contacts {
		if contact.Email != nil && *contact.Email != "" {
			toEmail = *contact.Email
			toName = contact.Name
			break
		}
	}

	if toEmail == "" {
		return fmt.Errorf("client has no contact with email")
	}

	// Fallback to client name if contact name is empty
	if toName == "" {
		toName = clientEntity.Name
	}

	// Generate HTML body using messageBody as custom content if provided
	var htmlContent string
	if isFullHTML {
		htmlContent = content
	} else {
		htmlContent = s.generateEmailBody(invoice, subject, org.Name, emailType, content)
	}

	toAddress := toEmail
	if toName != "" {
		toAddress = fmt.Sprintf("%s <%s>", toName, toEmail)
	}

	fromAddress := fmt.Sprintf("%s <financeiro@codgital.com>", org.Name)

	req := usesend.SendEmailRequest{
		To:      toAddress,
		From:    fromAddress, // Reverted to verified domain
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
	if err := s.emailRepo.Create(ctx, emailRecord); err != nil {
		return err
	}

	// If invoice is in draft, update to sent
	if invoice.Status == InvoiceStatusDraft {
		invoice.Status = InvoiceStatusSent
		err := s.repo.Update(ctx, invoice)
		if err != nil {
			fmt.Printf("Error updating invoice status to sent: %v\n", err)
			// Don't fail the request just because status update failed, email was sent
		}
	}

	return nil
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
			messageBody = "Uma nova fatura foi gerada para você. Abaixo estão os detalhes:"
		case InvoiceEmailTypeFirst:
			messageBody = "Este é um lembrete sobre sua fatura em aberto. Por favor, verifique os detalhes abaixo:"
		case InvoiceEmailTypeSecond:
			messageBody = "Ainda não identificamos o pagamento da sua fatura. Caso já tenha efetuado, por favor desconsidere."
		case InvoiceEmailTypeThird:
			messageBody = "Esta é uma última notificação sobre sua fatura pendente. Por favor, regularize o quanto antes."
		default:
			messageBody = "Seguem os detalhes da sua fatura:"
		}
	}

	// Badge color based on email type
	badgeColor := "#0ea5e9" // Default blue
	badgeText := "Nova Fatura"
	switch emailType {
	case InvoiceEmailTypeFirst:
		badgeColor = "#f59e0b"
		badgeText = "Lembrete"
	case InvoiceEmailTypeSecond:
		badgeColor = "#f97316"
		badgeText = "2º Lembrete"
	case InvoiceEmailTypeThird:
		badgeColor = "#ef4444"
		badgeText = "Urgente"
	}

	// Use Tiptap-compatible HTML structure for preview in editor
	// The button uses data attributes that Tiptap Button extension expects
	return fmt.Sprintf(`<h2 style="text-align: center; font-family: Inter, system-ui, sans-serif; color: #111827;">%s</h2>
<p style="text-align: center; color: %s; font-weight: 600; font-family: Inter, system-ui, sans-serif; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; margin-top: 4px;">%s</p>
<p style="text-align: center; font-family: Inter, system-ui, sans-serif; color: #4b5563; margin-top: 24px; margin-bottom: 24px; line-height: 1.5;">%s</p>
<hr style="border-color: #e5e7eb; margin: 24px 0;">
<h3 style="text-align: center; font-family: Inter, system-ui, sans-serif; color: #374151; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Fatura #%s</h3>
<p style="text-align: center; margin-top: 8px;"><strong style="font-size: 32px; color: #0ea5e9; font-family: Inter, system-ui, sans-serif; letter-spacing: -0.02em;">%s</strong></p>
<p style="text-align: center; font-family: Inter, system-ui, sans-serif; color: #4b5563; font-size: 14px;">Vencimento: <strong style="color: #111827;">%s</strong></p>
<div data-type="button" data-text="Visualizar Fatura →" data-url="%s" data-alignment="center" data-variant="filled" data-button-color="#0ea5e9" data-text-color="#ffffff" data-border-radius="smooth"></div>
<p style="text-align: center; margin-top: 32px;"><small style="color: #9ca3af; font-family: Inter, system-ui, sans-serif;">Dúvidas? Responda este email ou entre em contato conosco.</small></p>
<hr style="border-color: #e5e7eb; margin: 24px 0;">
<p style="text-align: center; margin-bottom: 0;"><small style="color: #9ca3af; font-family: Inter, system-ui, sans-serif;">© %d %s. Todos os direitos reservados.</small></p>
`, orgName, badgeColor, badgeText, messageBody, invoice.Number, totalFormatted, dueDate, publicLink, time.Now().Year(), orgName)
}

// adjustColorBrightness creates a slightly darker shade for gradient effect
func adjustColorBrightness(hexColor string) string {
	// Simple darkening - for complex colors, this creates a nice gradient
	switch hexColor {
	case "#0ea5e9":
		return "#0284c7" // Darker blue
	case "#f59e0b":
		return "#d97706" // Darker amber
	case "#f97316":
		return "#ea580c" // Darker orange
	case "#ef4444":
		return "#dc2626" // Darker red
	default:
		return hexColor
	}
}

func (s *Service) GetEmailHistory(ctx context.Context, id uuid.UUID) ([]*InvoiceEmail, error) {
	return s.emailRepo.GetByInvoiceID(ctx, id.String())
}
