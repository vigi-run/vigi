package inter

import (
	"context"

	"github.com/uptrace/bun"
)

type WebhookRepository interface {
	Create(ctx context.Context, event *WebhookEvent) error
	Update(ctx context.Context, event *WebhookEvent) error
}

type SQLWebhookRepository struct {
	db *bun.DB
}

func NewSQLWebhookRepository(db *bun.DB) *SQLWebhookRepository {
	return &SQLWebhookRepository{
		db: db,
	}
}

func (r *SQLWebhookRepository) Create(ctx context.Context, event *WebhookEvent) error {
	_, err := r.db.NewInsert().Model(event).Exec(ctx)
	return err
}

func (r *SQLWebhookRepository) Update(ctx context.Context, event *WebhookEvent) error {
	_, err := r.db.NewUpdate().Model(event).WherePK().Exec(ctx)
	return err
}
