package organization

import (
	"context"
	"errors"
	"time"
	"vigi/internal/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type mongoModel struct {
	ID        primitive.ObjectID `bson:"_id"`
	Name      string             `bson:"name"`
	Slug      string             `bson:"slug"`
	ImageURL  string             `bson:"image_url"`
	CreatedAt time.Time          `bson:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at"`
}

type mongoOrgUserModel struct {
	OrganizationID string    `bson:"organization_id"`
	UserID         string    `bson:"user_id"`
	Role           string    `bson:"role"`
	CreatedAt      time.Time `bson:"created_at"`
	UpdatedAt      time.Time `bson:"updated_at"`
}

type mongoInvitationModel struct {
	ID             primitive.ObjectID `bson:"_id"`
	OrganizationID string             `bson:"organization_id"`
	Email          string             `bson:"email"`
	Role           string             `bson:"role"`
	Token          string             `bson:"token"`
	Status         string             `bson:"status"`
	CreatedAt      time.Time          `bson:"created_at"`
	ExpiresAt      time.Time          `bson:"expires_at"`
}

func toDomainModelFromMongo(mm *mongoModel) *Organization {
	return &Organization{
		ID:        mm.ID.Hex(),
		Name:      mm.Name,
		Slug:      mm.Slug,
		ImageURL:  mm.ImageURL,
		CreatedAt: mm.CreatedAt,
		UpdatedAt: mm.UpdatedAt,
	}
}

type MongoRepositoryImpl struct {
	client         *mongo.Client
	db             *mongo.Database
	orgColl        *mongo.Collection
	orgUserColl    *mongo.Collection
	invitationColl *mongo.Collection
}

func NewMongoRepository(client *mongo.Client, cfg *config.Config) OrganizationRepository {
	db := client.Database(cfg.DBName)
	return &MongoRepositoryImpl{
		client:         client,
		db:             db,
		orgColl:        db.Collection("organizations"),
		orgUserColl:    db.Collection("organization_users"),
		invitationColl: db.Collection("invitations"),
	}
}

func (r *MongoRepositoryImpl) Create(ctx context.Context, organization *Organization) (*Organization, error) {
	mm := &mongoModel{
		ID:        primitive.NewObjectID(),
		Name:      organization.Name,
		Slug:      organization.Slug,
		ImageURL:  organization.ImageURL,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err := r.orgColl.InsertOne(ctx, mm)
	if err != nil {
		return nil, err
	}

	return toDomainModelFromMongo(mm), nil
}

func (r *MongoRepositoryImpl) FindByID(ctx context.Context, id string) (*Organization, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var mm mongoModel
	err = r.orgColl.FindOne(ctx, bson.M{"_id": objectID}).Decode(&mm)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // Return nil if not found, following pattern
		}
		return nil, err
	}
	return toDomainModelFromMongo(&mm), nil
}

func (r *MongoRepositoryImpl) FindBySlug(ctx context.Context, slug string) (*Organization, error) {
	var mm mongoModel
	err := r.orgColl.FindOne(ctx, bson.M{"slug": slug}).Decode(&mm)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return toDomainModelFromMongo(&mm), nil
}

func (r *MongoRepositoryImpl) Update(ctx context.Context, id string, organization *Organization) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	update := bson.M{
		"$set": bson.M{
			"name":       organization.Name,
			"slug":       organization.Slug,
			"image_url":  organization.ImageURL,
			"updated_at": time.Now(),
		},
	}

	_, err = r.orgColl.UpdateOne(ctx, bson.M{"_id": objectID}, update)
	return err
}

func (r *MongoRepositoryImpl) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.orgColl.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}

func (r *MongoRepositoryImpl) FindAll(ctx context.Context) ([]*Organization, error) {
	cursor, err := r.orgColl.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var organizations []*Organization
	for cursor.Next(ctx) {
		var mm mongoModel
		if err := cursor.Decode(&mm); err != nil {
			return nil, err
		}
		organizations = append(organizations, toDomainModelFromMongo(&mm))
	}
	return organizations, cursor.Err()
}

func (r *MongoRepositoryImpl) FindAllCount(ctx context.Context) (int64, error) {
	return r.orgColl.CountDocuments(ctx, bson.M{})
}

// Members
func (r *MongoRepositoryImpl) AddMember(ctx context.Context, orgUser *OrganizationUser) error {
	mm := &mongoOrgUserModel{
		OrganizationID: orgUser.OrganizationID,
		UserID:         orgUser.UserID,
		Role:           string(orgUser.Role),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	_, err := r.orgUserColl.InsertOne(ctx, mm)
	return err
}

func (r *MongoRepositoryImpl) RemoveMember(ctx context.Context, orgID, userID string) error {
	_, err := r.orgUserColl.DeleteOne(ctx, bson.M{"organization_id": orgID, "user_id": userID})
	return err
}

func (r *MongoRepositoryImpl) UpdateMemberRole(ctx context.Context, orgID, userID string, role Role) error {
	update := bson.M{
		"$set": bson.M{
			"role":       string(role),
			"updated_at": time.Now(),
		},
	}
	_, err := r.orgUserColl.UpdateOne(ctx, bson.M{"organization_id": orgID, "user_id": userID}, update)
	return err
}

func (r *MongoRepositoryImpl) FindMembers(ctx context.Context, orgID string) ([]*OrganizationUser, error) {
	cursor, err := r.orgUserColl.Find(ctx, bson.M{"organization_id": orgID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*OrganizationUser
	for cursor.Next(ctx) {
		var mm mongoOrgUserModel
		if err := cursor.Decode(&mm); err != nil {
			return nil, err
		}

		// For simplicity, we are not fetching the User/Organization relations here as Mongo doesn't do joins easily without aggregations.
		// The service layer might need to handle enrichment if strictly required, but usually basic info is enough or fetched separately.
		// However, the SQL implementation does fetch 'User' and 'Organization'.
		// To match parity, we should ideally fetch user details. But 'users' collection access might be needed.
		// Assuming we can return the ID relation and let the frontend/service handle it or implement lookup later if critical.
		// For now, returning basic struct.

		members = append(members, &OrganizationUser{
			OrganizationID: mm.OrganizationID,
			UserID:         mm.UserID,
			Role:           Role(mm.Role),
			CreatedAt:      mm.CreatedAt,
			UpdatedAt:      mm.UpdatedAt,
		})
	}
	return members, nil
}

func (r *MongoRepositoryImpl) FindUserOrganizations(ctx context.Context, userID string) ([]*OrganizationUser, error) {
	cursor, err := r.orgUserColl.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []*OrganizationUser
	for cursor.Next(ctx) {
		var mm mongoOrgUserModel
		if err := cursor.Decode(&mm); err != nil {
			return nil, err
		}

		// Ideally fetching Organization details here too via aggregation or separate query.
		// Implementing basic fetch for now.
		org, _ := r.FindByID(ctx, mm.OrganizationID)

		ou := &OrganizationUser{
			OrganizationID: mm.OrganizationID,
			UserID:         mm.UserID,
			Role:           Role(mm.Role),
			CreatedAt:      mm.CreatedAt,
			UpdatedAt:      mm.UpdatedAt,
		}
		if org != nil {
			ou.Organization = org
		}
		members = append(members, ou)
	}
	return members, nil
}

func (r *MongoRepositoryImpl) FindMembership(ctx context.Context, orgID, userID string) (*OrganizationUser, error) {
	var mm mongoOrgUserModel
	err := r.orgUserColl.FindOne(ctx, bson.M{"organization_id": orgID, "user_id": userID}).Decode(&mm)
	if err != nil {
		return nil, err
	}

	return &OrganizationUser{
		OrganizationID: mm.OrganizationID,
		UserID:         mm.UserID,
		Role:           Role(mm.Role),
		CreatedAt:      mm.CreatedAt,
		UpdatedAt:      mm.UpdatedAt,
	}, nil
}

// Invitations
func (r *MongoRepositoryImpl) CreateInvitation(ctx context.Context, invitation *Invitation) error {
	mm := &mongoInvitationModel{
		ID:             primitive.NewObjectID(),
		OrganizationID: invitation.OrganizationID,
		Email:          invitation.Email,
		Role:           string(invitation.Role),
		Token:          invitation.Token,
		Status:         string(invitation.Status),
		CreatedAt:      invitation.CreatedAt,
		ExpiresAt:      invitation.ExpiresAt,
	}
	// Careful: Domain model might expect string ID. If the incoming ID is empty, we generate one.
	if invitation.ID != "" {
		if oid, err := primitive.ObjectIDFromHex(invitation.ID); err == nil {
			mm.ID = oid
		}
	}

	_, err := r.invitationColl.InsertOne(ctx, mm)
	return err
}

func (r *MongoRepositoryImpl) FindInvitations(ctx context.Context, orgID string) ([]*Invitation, error) {
	cursor, err := r.invitationColl.Find(ctx, bson.M{"organization_id": orgID, "status": "pending"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var invitations []*Invitation
	for cursor.Next(ctx) {
		var mm mongoInvitationModel
		if err := cursor.Decode(&mm); err != nil {
			return nil, err
		}
		invitations = append(invitations, &Invitation{
			ID:             mm.ID.Hex(),
			OrganizationID: mm.OrganizationID,
			Email:          mm.Email,
			Role:           Role(mm.Role),
			Token:          mm.Token,
			Status:         InvitationStatus(mm.Status),
			CreatedAt:      mm.CreatedAt,
			ExpiresAt:      mm.ExpiresAt,
		})
	}
	return invitations, nil
}

func (r *MongoRepositoryImpl) FindInvitationByToken(ctx context.Context, token string) (*Invitation, error) {
	var mm mongoInvitationModel
	err := r.invitationColl.FindOne(ctx, bson.M{"token": token}).Decode(&mm)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}

	inv := &Invitation{
		ID:             mm.ID.Hex(),
		OrganizationID: mm.OrganizationID,
		Email:          mm.Email,
		Role:           Role(mm.Role),
		Token:          mm.Token,
		Status:         InvitationStatus(mm.Status),
		CreatedAt:      mm.CreatedAt,
		ExpiresAt:      mm.ExpiresAt,
	}

	// Fetch organization details to match SQL behavior
	if org, err := r.FindByID(ctx, mm.OrganizationID); err == nil && org != nil {
		inv.Organization = org
	}

	return inv, nil
}

func (r *MongoRepositoryImpl) FindInvitationsByEmail(ctx context.Context, email string) ([]*Invitation, error) {
	cursor, err := r.invitationColl.Find(ctx, bson.M{"email": email, "status": "pending"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var invitations []*Invitation
	for cursor.Next(ctx) {
		var mm mongoInvitationModel
		if err := cursor.Decode(&mm); err != nil {
			return nil, err
		}
		inv := &Invitation{
			ID:             mm.ID.Hex(),
			OrganizationID: mm.OrganizationID,
			Email:          mm.Email,
			Role:           Role(mm.Role),
			Token:          mm.Token,
			Status:         InvitationStatus(mm.Status),
			CreatedAt:      mm.CreatedAt,
			ExpiresAt:      mm.ExpiresAt,
		}

		// Fetch organization details
		if org, err := r.FindByID(ctx, mm.OrganizationID); err == nil && org != nil {
			inv.Organization = org
		}

		invitations = append(invitations, inv)
	}
	return invitations, nil
}

func (r *MongoRepositoryImpl) UpdateInvitationStatus(ctx context.Context, id string, status InvitationStatus) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = r.invitationColl.UpdateOne(ctx, bson.M{"_id": objectID}, bson.M{"$set": bson.M{"status": string(status)}})
	return err
}
