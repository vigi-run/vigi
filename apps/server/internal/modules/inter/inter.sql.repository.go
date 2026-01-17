package inter

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

func (r *SQLRepository) Create(ctx context.Context, config *InterConfig) error {
	_, err := r.db.NewInsert().Model(config).Exec(ctx)
	return err
}

func (r *SQLRepository) GetByOrganizationID(ctx context.Context, organizationID uuid.UUID) (*InterConfig, error) {
	config := new(InterConfig)
	err := r.db.NewSelect().Model(config).Where("organization_id = ?", organizationID).Scan(ctx)
	if err != nil {
		return nil, err
	}
	return config, nil
}

func (r *SQLRepository) Update(ctx context.Context, config *InterConfig) error {
	_, err := r.db.NewUpdate().Model(config).WherePK().Exec(ctx)
	return err
}

func (r *SQLRepository) Delete(ctx context.Context, organizationID uuid.UUID) error {
	_, err := r.db.NewDelete().Model((*InterConfig)(nil)).Where("organization_id = ?", organizationID).Exec(ctx)
	return err
}
