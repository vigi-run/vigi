package recurring_invoice

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, entity *RecurringInvoice) error
	GetByID(ctx context.Context, id uuid.UUID) (*RecurringInvoice, error)
	GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter RecurringInvoiceFilter) ([]*RecurringInvoice, int, error)
	Update(ctx context.Context, entity *RecurringInvoice) error
	Delete(ctx context.Context, id uuid.UUID) error
}
