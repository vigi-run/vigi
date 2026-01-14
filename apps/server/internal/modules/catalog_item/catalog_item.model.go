package catalog_item

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

type CatalogItemType string

const (
	CatalogItemTypeProduct CatalogItemType = "PRODUCT"
	CatalogItemTypeService CatalogItemType = "SERVICE"
)

type CatalogItem struct {
	bun.BaseModel `bun:"table:catalog_items,alias:ci"`

	ID             uuid.UUID       `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrganizationID uuid.UUID       `bun:"organization_id,type:uuid" json:"organizationId"`
	Type           CatalogItemType `bun:"type,notnull" json:"type"`
	Name           string          `bun:"name" json:"name"`
	ProductKey     string          `bun:"product_key,notnull" json:"productKey"`
	Notes          string          `bun:"notes" json:"notes"`
	// Use SafeFloat to handle SQLite int64(0) scanning issue
	Price   SafeFloat `bun:"price,notnull" json:"price"`
	Cost    SafeFloat `bun:"cost,notnull" json:"cost"`
	Unit    string    `bun:"unit,notnull" json:"unit"`
	NcmNbs  string    `bun:"ncm_nbs" json:"ncmNbs"`
	TaxRate SafeFloat `bun:"tax_rate,notnull" json:"taxRate"`

	// Stock fields (only for products)
	// Stock fields (only for products)
	InStockQuantity   *float64 `bun:"in_stock_quantity" json:"inStockQuantity"`
	StockNotification *bool    `bun:"stock_notification" json:"stockNotification"`
	StockThreshold    *float64 `bun:"stock_threshold" json:"stockThreshold"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

var _ bun.BeforeAppendModelHook = (*CatalogItem)(nil)

func (c *CatalogItem) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		if c.ID == uuid.Nil {
			c.ID = uuid.New()
		}
		c.CreatedAt = time.Now()
		c.UpdatedAt = time.Now()
	case *bun.UpdateQuery:
		c.UpdatedAt = time.Now()
	}
	return nil
}
