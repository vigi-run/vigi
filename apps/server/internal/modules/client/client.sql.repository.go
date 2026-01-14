package client

import (
	"context"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type SQLRepository struct {
	db *bun.DB
}

func NewSQLRepository(db *bun.DB) *SQLRepository {
	return &SQLRepository{
		db: db,
	}
}

func (r *SQLRepository) Create(ctx context.Context, client *Client) error {
	_, err := r.db.NewInsert().Model(client).Exec(ctx)
	return err
}

func (r *SQLRepository) GetByID(ctx context.Context, id uuid.UUID) (*Client, error) {
	var client Client
	err := r.db.NewSelect().Model(&client).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *SQLRepository) GetByOrganizationID(ctx context.Context, organizationID uuid.UUID, filter ClientFilter) ([]*Client, int, error) {
	var clients []*Client
	query := r.db.NewSelect().Model(&clients).Where("organization_id = ?", organizationID)

	if filter.Search != nil && *filter.Search != "" {
		query.Where("LOWER(name) LIKE LOWER(?)", "%"+*filter.Search+"%")
	}

	if filter.Classification != nil && *filter.Classification != "" {
		query.Where("classification = ?", *filter.Classification)
	}

	if filter.Status != nil && *filter.Status != "" {
		query.Where("status = ?", *filter.Status)
	}

	if filter.Limit > 0 {
		query.Limit(filter.Limit)
	}

	if filter.Page > 0 {
		query.Offset((filter.Page - 1) * filter.Limit)
	}

	// Order by most recent
	query.Order("created_at DESC")

	count, err := query.ScanAndCount(ctx)
	if err != nil {
		return nil, 0, err
	}
	return clients, count, nil
}

func (r *SQLRepository) Update(ctx context.Context, client *Client) error {
	_, err := r.db.NewUpdate().Model(client).WherePK().Exec(ctx)
	return err
}

func (r *SQLRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.NewDelete().Model((*Client)(nil)).Where("id = ?", id).Exec(ctx)
	return err
}
