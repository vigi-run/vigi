package asaas

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type AsaasConfig struct {
	bun.BaseModel `bun:"table:asaas_configs"`

	ID             uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	OrganizationID uuid.UUID `bun:"organization_id,type:uuid"`
	ApiKey         string    `bun:"api_key"`
	Environment    string    `bun:"environment"` // 'sandbox' or 'production'
	CreatedAt      time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt      time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}
