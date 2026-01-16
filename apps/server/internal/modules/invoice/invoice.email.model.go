package invoice

import (
	"time"
	"vigi/internal/pkg/usesend"
)

type InvoiceEmailType string

const (
	InvoiceEmailTypeCreated InvoiceEmailType = "created"
	InvoiceEmailTypeFirst   InvoiceEmailType = "first"
	InvoiceEmailTypeSecond  InvoiceEmailType = "second"
	InvoiceEmailTypeThird   InvoiceEmailType = "third"
)

type InvoiceEmail struct {
	ID        string                 `bson:"_id,omitempty" json:"id"`
	InvoiceID string                 `bson:"invoice_id" json:"invoiceId"`
	Type      InvoiceEmailType       `bson:"type" json:"type"`
	EmailID   string                 `bson:"email_id" json:"emailId"`
	Status    usesend.EmailStatus    `bson:"status" json:"status"` // This will cause a compilation error if usesend is removed
	Events    []usesend.WebhookEvent `bson:"events" json:"events"` // This will cause a compilation error if usesend is removed
	CreatedAt time.Time              `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time              `bson:"updated_at" json:"updatedAt"`
}
