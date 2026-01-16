package invoice

import (
	"context"
	"errors"
	"time"
	"vigi/internal/config"
	"vigi/internal/pkg/usesend"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type EmailRepository interface {
	Create(ctx context.Context, entity *InvoiceEmail) error
	GetByInvoiceID(ctx context.Context, invoiceID string) ([]*InvoiceEmail, error)
	GetByEmailID(ctx context.Context, emailID string) (*InvoiceEmail, error)
	AddEvent(ctx context.Context, emailID string, event usesend.WebhookEvent, newStatus usesend.EmailStatus) error
}

type emailRepositoryImpl struct {
	db         *mongo.Client
	collection *mongo.Collection
}

func NewEmailRepository(db *mongo.Client, cfg *config.Config) EmailRepository {
	collection := db.Database(cfg.DBName).Collection("invoice_emails")
	return &emailRepositoryImpl{db, collection}
}

func (r *emailRepositoryImpl) Create(ctx context.Context, entity *InvoiceEmail) error {
	if entity.ID == "" {
		entity.ID = primitive.NewObjectID().Hex()
	}
	entity.CreatedAt = time.Now()
	entity.UpdatedAt = time.Now()

	// Convert string ID to ObjectID for Mongo storage if needed, or just store as string?
	// Consistent with other modules? Typically we store ObjectID.
	// But `entity` is shared.
	// Let's create a mongo-specific struct wrapper? No, too much overhead.
	// I'll just change `InvoiceEmail` ID to be `interface{}` or string.
	// If I changed it to string in model, Mongo driver handles string -> ObjectID if tag says `omitempty`? No.
	// I'll stick to string ID for now as it's easiest for SQL compatibility.

	_, err := r.collection.InsertOne(ctx, entity)
	return err
}

func (r *emailRepositoryImpl) GetByInvoiceID(ctx context.Context, invoiceID string) ([]*InvoiceEmail, error) {
	var entities []*InvoiceEmail
	filter := bson.M{"invoice_id": invoiceID}
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	if err = cursor.All(ctx, &entities); err != nil {
		return nil, err
	}
	return entities, nil
}

func (r *emailRepositoryImpl) GetByEmailID(ctx context.Context, emailID string) (*InvoiceEmail, error) {
	var entity InvoiceEmail
	filter := bson.M{"email_id": emailID}
	err := r.collection.FindOne(ctx, filter).Decode(&entity)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &entity, nil
}

func (r *emailRepositoryImpl) AddEvent(ctx context.Context, emailID string, event usesend.WebhookEvent, newStatus usesend.EmailStatus) error {
	filter := bson.M{"email_id": emailID}
	update := bson.M{
		"$push": bson.M{"events": event},
		"$set": bson.M{
			"status":     newStatus,
			"updated_at": time.Now(),
		},
	}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}
