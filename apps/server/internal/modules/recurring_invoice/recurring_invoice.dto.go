package recurring_invoice

import (
	"time"

	"github.com/google/uuid"
)

type CreateRecurringInvoiceItemDTO struct {
	CatalogItemID *uuid.UUID `json:"catalogItemId"`
	Description   string     `json:"description" validate:"required"`
	Quantity      float64    `json:"quantity" validate:"gt=0"`
	UnitPrice     float64    `json:"unitPrice" validate:"gte=0"`
	Discount      float64    `json:"discount" validate:"gte=0"`
}

type CreateRecurringInvoiceDTO struct {
	ClientID           uuid.UUID                       `json:"clientId" validate:"required"`
	Number             string                          `json:"number" validate:"required"`
	NextGenerationDate *time.Time                      `json:"nextGenerationDate" validate:"required"`
	Date               *time.Time                      `json:"date"`
	DueDate            *time.Time                      `json:"dueDate"`
	Terms              string                          `json:"terms"`
	Notes              string                          `json:"notes"`
	Discount           float64                         `json:"discount" validate:"gte=0"`
	Items              []CreateRecurringInvoiceItemDTO `json:"items" validate:"required,min=1,dive"`
}

type UpdateRecurringInvoiceDTO struct {
	ClientID           *uuid.UUID                      `json:"clientId"`
	Number             *string                         `json:"number"`
	Status             *RecurringInvoiceStatus         `json:"status"`
	NextGenerationDate *time.Time                      `json:"nextGenerationDate"`
	Date               *time.Time                      `json:"date"`
	DueDate            *time.Time                      `json:"dueDate"`
	Terms              *string                         `json:"terms"`
	Notes              *string                         `json:"notes"`
	Discount           *float64                        `json:"discount" validate:"omitempty,gte=0"`
	Items              []CreateRecurringInvoiceItemDTO `json:"items" validate:"omitempty,min=1,dive"`
}

type RecurringInvoiceFilter struct {
	Limit    int                     `form:"limit"`
	Page     int                     `form:"page"`
	Search   *string                 `form:"q"`
	Status   *RecurringInvoiceStatus `form:"status"`
	ClientID *uuid.UUID              `form:"clientId"`
}
