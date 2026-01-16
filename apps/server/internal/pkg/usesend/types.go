package usesend

import "time"

type EmailStatus string

const (
	EmailStatusSent             EmailStatus = "SENT"
	EmailStatusDelivered        EmailStatus = "DELIVERED"
	EmailStatusBounced          EmailStatus = "BOUNCED"
	EmailStatusComplained       EmailStatus = "COMPLAINED"
	EmailStatusRejected         EmailStatus = "REJECTED"
	EmailStatusOpened           EmailStatus = "OPENED"
	EmailStatusClicked          EmailStatus = "CLICKED"
	EmailStatusRenderingFailure EmailStatus = "RENDERING_FAILURE"
	EmailStatusDeliveryDelayed  EmailStatus = "DELIVERY_DELAYED"
)

type SendEmailRequest struct {
	To      string            `json:"to"`
	From    string            `json:"from"`
	Subject string            `json:"subject"`
	HTML    string            `json:"html"`
	Tags    map[string]string `json:"tags,omitempty"`
}

type SendEmailResponse struct {
	EmailID string `json:"emailId"`
}

type WebhookEvent struct {
	Event   string         `json:"event"`
	Payload WebhookPayload `json:"payload"`
}

type WebhookPayload struct {
	EmailID string      `json:"emailId"`
	Status  string      `json:"status"`
	Data    WebhookData `json:"data"`
}

type WebhookData struct {
	Timestamp time.Time `json:"timestamp"`
	IPAddress string    `json:"ipAddress,omitempty"`
	UserAgent string    `json:"userAgent,omitempty"`
	Link      string    `json:"link,omitempty"`
}
