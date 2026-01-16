package invoice

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

func (r *SQLRepository) Create(ctx context.Context, entity *Invoice) error {
	return r.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(entity).Exec(ctx); err != nil {
			return err
		}
		if len(entity.Items) > 0 {
			for _, item := range entity.Items {
				item.InvoiceID = entity.ID
				if _, err := tx.NewInsert().Model(item).Exec(ctx); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *SQLRepository) GetByID(ctx context.Context, id uuid.UUID) (*Invoice, error) {
	entity := new(Invoice)
	if err := r.db.NewSelect().Model(entity).Relation("Items").Where("inv.id = ?", id).Scan(ctx); err != nil {
		return nil, err
	}
	return entity, nil
}

func (r *SQLRepository) GetByBankID(ctx context.Context, bankID string) (*Invoice, error) {
	entity := new(Invoice)
	if err := r.db.NewSelect().Model(entity).Relation("Items").Where("bank_invoice_id = ?", bankID).Scan(ctx); err != nil {
		return nil, err
	}
	return entity, nil
}

func (r *SQLRepository) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter InvoiceFilter) ([]*Invoice, int, error) {
	var entities []*Invoice
	query := r.db.NewSelect().Model(&entities).Relation("Items").Where("organization_id = ?", orgID)

	// Case-insensitive search (SQLite compatible)
	if filter.Search != nil && *filter.Search != "" {
		query.Where("LOWER(number) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?)", "%"+*filter.Search+"%", "%"+*filter.Search+"%")
	}

	if filter.Status != nil && *filter.Status != "" {
		query.Where("status = ?", *filter.Status)
	}

	if filter.ClientID != nil {
		query.Where("client_id = ?", *filter.ClientID)
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

func (r *SQLRepository) Update(ctx context.Context, entity *Invoice) error {
	return r.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewUpdate().Model(entity).WherePK().Exec(ctx); err != nil {
			return err
		}
		// Replace items strategy: delete all and re-create
		if _, err := tx.NewDelete().Model((*InvoiceItem)(nil)).Where("invoice_id = ?", entity.ID).Exec(ctx); err != nil {
			return err
		}
		if len(entity.Items) > 0 {
			for _, item := range entity.Items {
				item.InvoiceID = entity.ID
				if _, err := tx.NewInsert().Model(item).Exec(ctx); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *SQLRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.NewDelete().Model((*Invoice)(nil)).Where("id = ?", id).Exec(ctx)
	return err
}
