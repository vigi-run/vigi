package inter

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type InterEnvironment string

const (
	InterEnvironmentSandbox    InterEnvironment = "sandbox"
	InterEnvironmentProduction InterEnvironment = "production"
)

type InterConfig struct {
	bun.BaseModel `bun:"table:inter_configurations,alias:ic"`

	ID             uuid.UUID        `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	OrganizationID uuid.UUID        `bun:"organization_id,type:uuid,unique" json:"organizationId"`
	ClientID       string           `bun:"client_id,notnull" json:"clientId"`
	ClientSecret   string           `bun:"client_secret,notnull" json:"clientSecret"`
	Certificate    string           `bun:"certificate,notnull" json:"certificate"`
	Key            string           `bun:"cert_key,notnull" json:"key"`
	AccountNumber  *string          `bun:"account_number" json:"accountNumber"`
	Environment    InterEnvironment `bun:"environment,notnull,default:'sandbox'" json:"environment"`

	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

var _ bun.BeforeAppendModelHook = (*InterConfig)(nil)

func (c *InterConfig) BeforeAppendModel(ctx context.Context, query bun.Query) error {
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
