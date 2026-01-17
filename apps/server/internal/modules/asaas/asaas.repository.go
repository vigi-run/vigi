package asaas

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type Repository interface {
	Create(ctx context.Context, config *AsaasConfig) error
	Update(ctx context.Context, config *AsaasConfig) error
	GetByOrganizationID(ctx context.Context, organizationID uuid.UUID) (*AsaasConfig, error)
}

type RepositoryImpl struct {
	db *bun.DB
}

func NewRepository(db *bun.DB) Repository {
	return &RepositoryImpl{db: db}
}

func (r *RepositoryImpl) Create(ctx context.Context, config *AsaasConfig) error {
	_, err := r.db.NewInsert().Model(config).Exec(ctx)
	return err
}

func (r *RepositoryImpl) Update(ctx context.Context, config *AsaasConfig) error {
	_, err := r.db.NewUpdate().Model(config).WherePK().Exec(ctx)
	return err
}

func (r *RepositoryImpl) GetByOrganizationID(ctx context.Context, organizationID uuid.UUID) (*AsaasConfig, error) {
	var config AsaasConfig
	err := r.db.NewSelect().Model(&config).Where("organization_id = ?", organizationID).Scan(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}
