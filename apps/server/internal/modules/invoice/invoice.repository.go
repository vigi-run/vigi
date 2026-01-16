package invoice

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, entity *Invoice) error
	GetByID(ctx context.Context, id uuid.UUID) (*Invoice, error)
	GetByBankID(ctx context.Context, bankID string) (*Invoice, error)
	GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter InvoiceFilter) ([]*Invoice, int, error)
	Update(ctx context.Context, entity *Invoice) error
	Delete(ctx context.Context, id uuid.UUID) error
}
