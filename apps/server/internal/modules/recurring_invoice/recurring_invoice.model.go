package recurring_invoice

import (
	"context"
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// SafeFloat is a float64 wrapper that handles SQLite's int64 scanning behavior
type SafeFloat float64

// Scan implements the sql.Scanner interface
func (s *SafeFloat) Scan(src interface{}) error {
	if src == nil {
		*s = 0
		return nil
	}

	switch v := src.(type) {
	case float64:
		*s = SafeFloat(v)
		return nil
	case int64:
		*s = SafeFloat(float64(v))
		return nil
	case []byte:
		var f float64
		if _, err := fmt.Sscanf(string(v), "%f", &f); err != nil {
			return err
		}
		*s = SafeFloat(f)
		return nil
	default:
		return fmt.Errorf("failed to scan type %T into SafeFloat", src)
	}
}

// Value implements the driver.Valuer interface
func (s SafeFloat) Value() (driver.Value, error) {
	return float64(s), nil
}

type RecurringInvoiceStatus string

const (
	RecurringInvoiceStatusActive    RecurringInvoiceStatus = "ACTIVE"
	RecurringInvoiceStatusPaused    RecurringInvoiceStatus = "PAUSED"
	RecurringInvoiceStatusCancelled RecurringInvoiceStatus = "CANCELLED"
)

type RecurringInvoice struct {
	bun.BaseModel `bun:"table:recurring_invoices,alias:rinv"`

	ID             uuid.UUID              `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrganizationID uuid.UUID              `bun:"organization_id,type:uuid" json:"organizationId"`
	ClientID       uuid.UUID              `bun:"client_id,type:uuid" json:"clientId"`
	Number         string                 `bun:"number,notnull" json:"number"`
	Status         RecurringInvoiceStatus `bun:"status,notnull,default:'ACTIVE'" json:"status"`
	// This is likely the "data que deve gerar a fatura"
	NextGenerationDate *time.Time `bun:"next_generation_date" json:"nextGenerationDate"`

	// Fields from Invoice
	Date     *time.Time `bun:"date" json:"date"`
	DueDate  *time.Time `bun:"due_date" json:"dueDate"`
	Terms    string     `bun:"terms" json:"terms"`
	Notes    string     `bun:"notes" json:"notes"`
	Total    SafeFloat  `bun:"total,notnull" json:"total"`
	Discount SafeFloat  `bun:"discount,notnull" json:"discount"`
	Currency string     `bun:"currency,notnull,default:'BRL'" json:"currency"`

	Items []*RecurringInvoiceItem `bun:"rel:has-many,join:id=recurring_invoice_id" json:"items"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

type RecurringInvoiceItem struct {
	bun.BaseModel `bun:"table:recurring_invoice_items,alias:ritm"`

	ID                 uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	RecurringInvoiceID uuid.UUID  `bun:"recurring_invoice_id,type:uuid" json:"recurringInvoiceId"`
	CatalogItemID      *uuid.UUID `bun:"catalog_item_id,type:uuid,nullzero" json:"catalogItemId"`
	Description        string     `bun:"description,notnull" json:"description"`
	Quantity           SafeFloat  `bun:"quantity,notnull" json:"quantity"`
	UnitPrice          SafeFloat  `bun:"unit_price,notnull" json:"unitPrice"`
	Discount           SafeFloat  `bun:"discount,notnull" json:"discount"`
	Total              SafeFloat  `bun:"total,notnull" json:"total"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
}

var _ bun.BeforeAppendModelHook = (*RecurringInvoice)(nil)

func (i *RecurringInvoice) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		if i.ID == uuid.Nil {
			i.ID = uuid.New()
		}
		i.CreatedAt = time.Now()
		i.UpdatedAt = time.Now()
	case *bun.UpdateQuery:
		i.UpdatedAt = time.Now()
	}
	return nil
}

var _ bun.BeforeAppendModelHook = (*RecurringInvoiceItem)(nil)

func (i *RecurringInvoiceItem) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		if i.ID == uuid.Nil {
			i.ID = uuid.New()
		}
		i.CreatedAt = time.Now()
	}
	return nil
}
