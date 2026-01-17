package invoice

import (
	"context"
	"database/sql/driver"
	"fmt"
	"time"

	"vigi/internal/modules/client"

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

type InvoiceStatus string

const (
	InvoiceStatusDraft     InvoiceStatus = "DRAFT"
	InvoiceStatusSent      InvoiceStatus = "SENT"
	InvoiceStatusPaid      InvoiceStatus = "PAID"
	InvoiceStatusCancelled InvoiceStatus = "CANCELLED"
)

type Invoice struct {
	bun.BaseModel `bun:"table:invoices,alias:inv"`

	ID                      uuid.UUID      `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrganizationID          uuid.UUID      `bun:"organization_id,type:uuid" json:"organizationId"`
	ClientID                uuid.UUID      `bun:"client_id,type:uuid" json:"clientId"`
	Client                  *client.Client `bun:"rel:belongs-to,join:client_id=id" json:"client"`
	Number                  string         `bun:"number,notnull" json:"number"`
	Status                  InvoiceStatus  `bun:"status,notnull,default:'DRAFT'" json:"status"`
	Date                    *time.Time     `bun:"date" json:"date"`
	DueDate                 *time.Time     `bun:"due_date" json:"dueDate"`
	Terms                   string         `bun:"terms" json:"terms"`
	Notes                   string         `bun:"notes" json:"notes"`
	Total                   SafeFloat      `bun:"total,notnull" json:"total"`
	Discount                SafeFloat      `bun:"discount,notnull" json:"discount"`
	NFID                    *string        `bun:"nf_id" json:"nfId"`
	NFStatus                *string        `bun:"nf_status" json:"nfStatus"`
	NFLink                  *string        `bun:"nf_link" json:"nfLink"`
	BankInvoiceID           *string        `bun:"bank_invoice_id" json:"bankInvoiceId"`
	BankInvoiceStatus       *string        `bun:"bank_invoice_status" json:"bankInvoiceStatus"`
	BankProvider            *string        `bun:"bank_provider" json:"bankProvider"`
	BankPixPayload          *string        `bun:"bank_pix_payload" json:"bankPixPayload"`
	BankBoletoBarcode       *string        `bun:"bank_boleto_barcode" json:"bankBoletoBarcode"`
	BankBoletoDigitableLine *string        `bun:"bank_boleto_digitable_line" json:"bankBoletoDigitableLine"`
	Currency                string         `bun:"currency,notnull,default:'BRL'" json:"currency"`

	Items []*InvoiceItem `bun:"rel:has-many,join:id=invoice_id" json:"items"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

type InvoiceItem struct {
	bun.BaseModel `bun:"table:invoice_items,alias:itm"`

	ID            uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	InvoiceID     uuid.UUID  `bun:"invoice_id,type:uuid" json:"invoiceId"`
	CatalogItemID *uuid.UUID `bun:"catalog_item_id,type:uuid,nullzero" json:"catalogItemId"`
	Description   string     `bun:"description,notnull" json:"description"`
	Quantity      SafeFloat  `bun:"quantity,notnull" json:"quantity"`
	UnitPrice     SafeFloat  `bun:"unit_price,notnull" json:"unitPrice"`
	Discount      SafeFloat  `bun:"discount,notnull" json:"discount"`
	Total         SafeFloat  `bun:"total,notnull" json:"total"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
}

var _ bun.BeforeAppendModelHook = (*Invoice)(nil)

func (i *Invoice) BeforeAppendModel(ctx context.Context, query bun.Query) error {
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

var _ bun.BeforeAppendModelHook = (*InvoiceItem)(nil)

func (i *InvoiceItem) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		if i.ID == uuid.Nil {
			i.ID = uuid.New()
		}
		i.CreatedAt = time.Now()
	}
	return nil
}
