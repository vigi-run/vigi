package client

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, client *Client) error
	GetByID(ctx context.Context, id uuid.UUID) (*Client, error)
	GetByOrganizationID(ctx context.Context, organizationID uuid.UUID, filter ClientFilter) ([]*Client, int, error)
	Update(ctx context.Context, client *Client) error
	Delete(ctx context.Context, id uuid.UUID) error
}
