package inter

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type WebhookEvent struct {
	bun.BaseModel `bun:"table:webhook_events,alias:we"`

	ID         uuid.UUID  `bun:"id,pk,type:uuid"`
	Provider   string     `bun:"provider,notnull"`
	Payload    string     `bun:"payload,notnull,type:text"`
	Processed  bool       `bun:"processed,default:false"`
	Error      *string    `bun:"error"`
	ResourceID *uuid.UUID `bun:"resource_id,type:uuid"`
	CreatedAt  time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt  time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}
