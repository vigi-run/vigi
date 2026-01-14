package catalog_item

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, entity *CatalogItem) error
	GetByID(ctx context.Context, id uuid.UUID) (*CatalogItem, error)
	GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter CatalogItemFilter) ([]*CatalogItem, int, error)
	Update(ctx context.Context, entity *CatalogItem) error
	Delete(ctx context.Context, id uuid.UUID) error
}
