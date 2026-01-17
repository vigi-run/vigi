package inter

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, config *InterConfig) error
	GetByOrganizationID(ctx context.Context, organizationID uuid.UUID) (*InterConfig, error)
	Update(ctx context.Context, config *InterConfig) error
	Delete(ctx context.Context, organizationID uuid.UUID) error
}
