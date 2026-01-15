package invoice

import (
	"time"

	"github.com/google/uuid"
)

type CreateInvoiceItemDTO struct {
	CatalogItemID *uuid.UUID `json:"catalogItemId"`
	Description   string     `json:"description" validate:"required"`
	Quantity      float64    `json:"quantity" validate:"gt=0"`
	UnitPrice     float64    `json:"unitPrice" validate:"gte=0"`
	Discount      float64    `json:"discount" validate:"gte=0"`
}

type CreateInvoiceDTO struct {
	ClientID          uuid.UUID              `json:"clientId" validate:"required"`
	Number            string                 `json:"number" validate:"required"`
	Date              *time.Time             `json:"date"`
	DueDate           *time.Time             `json:"dueDate"`
	Terms             string                 `json:"terms"`
	Notes             string                 `json:"notes"`
	NFID              *string                `json:"nfId"`
	NFStatus          *string                `json:"nfStatus"`
	NFLink            *string                `json:"nfLink"`
	BankInvoiceID     *string                `json:"bankInvoiceId"`
	BankInvoiceStatus *string                `json:"bankInvoiceStatus"`
	Discount          float64                `json:"discount" validate:"gte=0"`
	Items             []CreateInvoiceItemDTO `json:"items" validate:"required,min=1,dive"`
}

type UpdateInvoiceDTO struct {
	ClientID          *uuid.UUID             `json:"clientId"`
	Number            *string                `json:"number"`
	Status            *InvoiceStatus         `json:"status"`
	Date              *time.Time             `json:"date"`
	DueDate           *time.Time             `json:"dueDate"`
	Terms             *string                `json:"terms"`
	Notes             *string                `json:"notes"`
	NFID              *string                `json:"nfId"`
	NFStatus          *string                `json:"nfStatus"`
	NFLink            *string                `json:"nfLink"`
	BankInvoiceID     *string                `json:"bankInvoiceId"`
	BankInvoiceStatus *string                `json:"bankInvoiceStatus"`
	Discount          *float64               `json:"discount" validate:"omitempty,gte=0"`
	Items             []CreateInvoiceItemDTO `json:"items" validate:"omitempty,min=1,dive"`
}

type InvoiceFilter struct {
	Limit    int            `form:"limit"`
	Page     int            `form:"page"`
	Search   *string        `form:"q"`
	Status   *InvoiceStatus `form:"status"`
	ClientID *uuid.UUID     `form:"clientId"`
}
