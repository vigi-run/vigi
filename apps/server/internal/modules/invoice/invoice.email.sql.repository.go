package invoice

import (
	"context"
	"time"
	"vigi/internal/pkg/usesend"

	"github.com/uptrace/bun"
)

type InvoiceEmailSQL struct {
	bun.BaseModel `bun:"table:invoice_emails,alias:ie"`

	ID        string                 `bun:"id,pk"`
	InvoiceID string                 `bun:"invoice_id,notnull"`
	Type      InvoiceEmailType       `bun:"type,notnull"`
	EmailID   string                 `bun:"email_id,notnull"`
	Status    usesend.EmailStatus    `bun:"status,notnull"`
	Events    []usesend.WebhookEvent `bun:"events,type:jsonb"`
	CreatedAt time.Time              `bun:"created_at,default:current_timestamp"`
	UpdatedAt time.Time              `bun:"updated_at,default:current_timestamp"`
}

func (m *InvoiceEmailSQL) ToDomain() *InvoiceEmail {
	// Need to handle ID conversion if InvoiceEmail uses ObjectID, but if we switch entirely...
	// Domain model currently uses primitive.ObjectID for ID. We might need to make it generic or string.
	// For now, let's just make sure we can map it.
	return &InvoiceEmail{
		ID:        m.ID,
		InvoiceID: m.InvoiceID,
		Type:      m.Type,
		EmailID:   m.EmailID,
		Status:    m.Status,
		Events:    m.Events,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

type emailSQLRepository struct {
	db bun.IDB
}

func NewEmailSQLRepository(db *bun.DB) EmailRepository {
	return &emailSQLRepository{db: db}
}

func (r *emailSQLRepository) Create(ctx context.Context, entity *InvoiceEmail) error {
	sqlEntity := &InvoiceEmailSQL{
		ID:        entity.ID, // ID is now string
		InvoiceID: entity.InvoiceID,

		Type:      entity.Type,
		EmailID:   entity.EmailID,
		Status:    entity.Status,
		Events:    entity.Events,
		CreatedAt: entity.CreatedAt,
		UpdatedAt: entity.UpdatedAt,
	}
	// Handle generate ID if empty? Repository usually handles this.
	// But wait, `InvoiceEmail` ID field is `primitive.ObjectID`.
	// I should update `InvoiceEmail` domain model to use string ID to be compatible with both easier,
	// OR handle conversion. Since user wants SQL, string/UUID is better.

	_, err := r.db.NewInsert().Model(sqlEntity).Exec(ctx)
	return err
}

func (r *emailSQLRepository) GetByInvoiceID(ctx context.Context, invoiceID string) ([]*InvoiceEmail, error) {
	var sqlEntities []InvoiceEmailSQL
	err := r.db.NewSelect().Model(&sqlEntities).Where("invoice_id = ?", invoiceID).Scan(ctx)
	if err != nil {
		return nil, err
	}

	entities := make([]*InvoiceEmail, len(sqlEntities))
	for i, e := range sqlEntities {
		entities[i] = e.ToDomain()
	}
	return entities, nil
}

func (r *emailSQLRepository) GetByEmailID(ctx context.Context, emailID string) (*InvoiceEmail, error) {
	var sqlEntity InvoiceEmailSQL
	err := r.db.NewSelect().Model(&sqlEntity).Where("email_id = ?", emailID).Scan(ctx)
	if err != nil {
		return nil, err
	}
	return sqlEntity.ToDomain(), nil
}

func (r *emailSQLRepository) AddEvent(ctx context.Context, emailID string, event usesend.WebhookEvent, newStatus usesend.EmailStatus) error {
	var sqlEntity InvoiceEmailSQL
	err := r.db.NewSelect().Model(&sqlEntity).Where("email_id = ?", emailID).Scan(ctx)
	if err != nil {
		return err
	}

	sqlEntity.Events = append(sqlEntity.Events, event)
	sqlEntity.Status = newStatus
	sqlEntity.UpdatedAt = time.Now()

	_, err = r.db.NewUpdate().Model(&sqlEntity).Where("email_id = ?", emailID).Exec(ctx)
	return err
}
