package invoice

import (
	"context"
	"time"

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
	if err := r.db.NewSelect().Model(entity).Relation("Items").Relation("Client").Where("inv.id = ?", id).Scan(ctx); err != nil {
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

func (r *SQLRepository) GetStats(ctx context.Context, orgID uuid.UUID) (*InvoiceStatsDTO, error) {
	var stats InvoiceStatsDTO

	// We use Scan into pointers to map columns manually since DTO doesn't have bun tags
	err := r.db.NewSelect().Model((*Invoice)(nil)).
		ColumnExpr("COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) AS draft_count", InvoiceStatusDraft).
		ColumnExpr("COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) AS sent_count", InvoiceStatusSent).
		ColumnExpr("COALESCE(SUM(CASE WHEN (status = ? OR bank_invoice_status = ?) THEN 1 ELSE 0 END), 0) AS paid_count", InvoiceStatusPaid, "PAID"). // Paid check: local status OR bank status
		ColumnExpr("COALESCE(SUM(CASE WHEN status != ? AND status != ? AND status != ? AND due_date < ? THEN 1 ELSE 0 END), 0) AS overdue_count", InvoiceStatusPaid, InvoiceStatusCancelled, InvoiceStatusDraft, time.Now()).
		Where("organization_id = ?", orgID).
		Scan(ctx, &stats.DraftCount, &stats.SentCount, &stats.PaidCount, &stats.OverdueCount)

	if err != nil {
		return nil, err
	}
	return &stats, nil
}
