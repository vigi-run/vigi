package client

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type ClientClassification string

const (
	ClientClassificationIndividual ClientClassification = "individual"
	ClientClassificationCompany    ClientClassification = "company"
)

type ClientStatus string

const (
	ClientStatusActive   ClientStatus = "active"
	ClientStatusInactive ClientStatus = "inactive"
	ClientStatusBlocked  ClientStatus = "blocked"
)

type Client struct {
	bun.BaseModel `bun:"table:clients,alias:c"`

	ID             uuid.UUID            `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrganizationID uuid.UUID            `bun:"organization_id,type:uuid" json:"organizationId"`
	Name           string               `bun:"name,notnull" json:"name"`
	IDNumber       *string              `bun:"id_number" json:"idNumber"`
	VATNumber      *string              `bun:"vat_number" json:"vatNumber"`
	Address1       *string              `bun:"address1" json:"address1"`
	AddressNumber  *string              `bun:"address_number" json:"addressNumber"`
	Address2       *string              `bun:"address2" json:"address2"`
	Neighborhood   *string              `bun:"neighborhood" json:"neighborhood"`
	City           *string              `bun:"city" json:"city"`
	State          *string              `bun:"state" json:"state"`
	PostalCode     *string              `bun:"postal_code" json:"postalCode"`
	CustomValue1   *float64             `bun:"custom_value1" json:"customValue1"`
	Classification ClientClassification `bun:"classification,notnull,type:client_classification,default:'company'" json:"classification"`
	Status         ClientStatus         `bun:"status,notnull,type:client_status,default:'active'" json:"status"`
	
	Contacts []*ClientContact `bun:"rel:has-many,join:id=client_id" json:"contacts"`

	CreatedAt      time.Time            `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt      time.Time            `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

type ClientContact struct {
	bun.BaseModel `bun:"table:client_contacts,alias:cc"`

	ID       uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	ClientID uuid.UUID `bun:"client_id,type:uuid" json:"clientId"`
	Name     string    `bun:"name,notnull" json:"name"`
	Email    *string   `bun:"email" json:"email"`
	Phone    *string   `bun:"phone" json:"phone"`
	Role     *string   `bun:"role" json:"role"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

var _ bun.BeforeAppendModelHook = (*Client)(nil)

func (c *Client) BeforeAppendModel(ctx context.Context, query bun.Query) error {
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

var _ bun.BeforeAppendModelHook = (*ClientContact)(nil)

func (c *ClientContact) BeforeAppendModel(ctx context.Context, query bun.Query) error {
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
