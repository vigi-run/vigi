package catalog_item

import (
	"context"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type SQLRepository struct {
	db *bun.DB
}

func NewSQLRepository(db *bun.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

func (r *SQLRepository) Create(ctx context.Context, entity *CatalogItem) error {
	_, err := r.db.NewInsert().Model(entity).Exec(ctx)
	return err
}

func (r *SQLRepository) GetByID(ctx context.Context, id uuid.UUID) (*CatalogItem, error) {
	entity := new(CatalogItem)
	if err := r.db.NewSelect().Model(entity).Where("id = ?", id).Scan(ctx); err != nil {
		return nil, err
	}
	return entity, nil
}

func (r *SQLRepository) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter CatalogItemFilter) ([]*CatalogItem, int, error) {
	var entities []*CatalogItem
	query := r.db.NewSelect().Model(&entities).Where("organization_id = ?", orgID)

	// Case-insensitive search (SQLite compatible)
	if filter.Search != nil && *filter.Search != "" {
		query.Where("LOWER(name) LIKE LOWER(?) OR LOWER(product_key) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?) OR LOWER(ncm_nbs) LIKE LOWER(?)", "%"+*filter.Search+"%", "%"+*filter.Search+"%", "%"+*filter.Search+"%", "%"+*filter.Search+"%")
	}

	if filter.Type != nil && *filter.Type != "" {
		query.Where("type = ?", *filter.Type)
	}

	if filter.Limit > 0 {
		query.Limit(filter.Limit)
	}
	if filter.Page > 0 {
		query.Offset((filter.Page - 1) * filter.Limit)
	}

	query.Order("created_at DESC")

	count, err := query.ScanAndCount(ctx)
	if err != nil {
		return nil, 0, err
	}
	return entities, count, nil
}

func (r *SQLRepository) Update(ctx context.Context, entity *CatalogItem) error {
	_, err := r.db.NewUpdate().Model(entity).WherePK().Exec(ctx)
	return err
}

func (r *SQLRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.NewDelete().Model((*CatalogItem)(nil)).Where("id = ?", id).Exec(ctx)
	return err
}
