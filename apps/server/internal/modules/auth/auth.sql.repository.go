package auth

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

type sqlModel struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID             string    `bun:"id,pk"`
	Email          string    `bun:"email,unique,notnull"`
	Name           string    `bun:"name"`
	ImageURL       string    `bun:"image_url"`
	Password       string    `bun:"password,notnull"`
	Active         bool      `bun:"active,notnull,default:true"`
	TwoFASecret    string    `bun:"twofa_secret"`
	TwoFAStatus    bool      `bun:"twofa_status,notnull,default:false"`
	TwoFALastToken string    `bun:"twofa_last_token"`
	Role           string    `bun:"role"`
	CreatedAt      time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt      time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

func toDomainModelFromSQL(sm *sqlModel) *Model {
	return &Model{
		ID:             sm.ID,
		Email:          sm.Email,
		Name:           sm.Name,
		ImageURL:       sm.ImageURL,
		Password:       sm.Password,
		Active:         sm.Active,
		TwoFASecret:    sm.TwoFASecret,
		TwoFAStatus:    sm.TwoFAStatus,
		TwoFALastToken: sm.TwoFALastToken,
		Role:           sm.Role,
		CreatedAt:      sm.CreatedAt,
		UpdatedAt:      sm.UpdatedAt,
	}
}

func toSQLModel(m *Model) *sqlModel {
	return &sqlModel{
		ID:             m.ID,
		Email:          m.Email,
		Name:           m.Name,
		ImageURL:       m.ImageURL,
		Password:       m.Password,
		Active:         m.Active,
		TwoFASecret:    m.TwoFASecret,
		TwoFAStatus:    m.TwoFAStatus,
		TwoFALastToken: m.TwoFALastToken,
		Role:           m.Role,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

type SQLRepositoryImpl struct {
	db *bun.DB
}

func NewSQLRepository(db *bun.DB) Repository {
	return &SQLRepositoryImpl{db: db}
}

func (r *SQLRepositoryImpl) Create(ctx context.Context, user *Model) (*Model, error) {
	sm := &sqlModel{
		ID:             uuid.New().String(),
		Email:          user.Email,
		Name:           user.Name,
		ImageURL:       user.ImageURL,
		Password:       user.Password,
		Active:         user.Active,
		TwoFASecret:    user.TwoFASecret,
		TwoFAStatus:    user.TwoFAStatus,
		TwoFALastToken: user.TwoFALastToken,
		Role:           user.Role,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Let Bun handle ID generation based on the database type
	_, err := r.db.NewInsert().Model(sm).Returning("*").Exec(ctx)
	if err != nil {
		return nil, err
	}

	return toDomainModelFromSQL(sm), nil
}

func (r *SQLRepositoryImpl) FindByEmail(ctx context.Context, email string) (*Model, error) {
	sm := new(sqlModel)
	err := r.db.NewSelect().Model(sm).Where("email = ?", email).Scan(ctx)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return toDomainModelFromSQL(sm), nil
}

func (r *SQLRepositoryImpl) FindByID(ctx context.Context, id string) (*Model, error) {
	sm := new(sqlModel)
	err := r.db.NewSelect().Model(sm).Where("id = ?", id).Scan(ctx)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return toDomainModelFromSQL(sm), nil
}

func (r *SQLRepositoryImpl) FindAllCount(ctx context.Context) (int64, error) {
	count, err := r.db.NewSelect().Model((*sqlModel)(nil)).Count(ctx)
	return int64(count), err
}

func (r *SQLRepositoryImpl) FindAll(ctx context.Context) ([]*Model, error) {
	var models []*sqlModel
	err := r.db.NewSelect().Model(&models).Scan(ctx)
	if err != nil {
		return nil, err
	}

	var result []*Model
	for _, m := range models {
		result = append(result, toDomainModelFromSQL(m))
	}
	return result, nil
}

func (r *SQLRepositoryImpl) Update(ctx context.Context, id string, entity *UpdateModel) error {
	query := r.db.NewUpdate().Model((*sqlModel)(nil)).Where("id = ?", id)

	hasUpdates := false

	if entity.Email != nil {
		query = query.Set("email = ?", *entity.Email)
		hasUpdates = true
	}
	if entity.Name != nil {
		query = query.Set("name = ?", *entity.Name)
		hasUpdates = true
	}
	if entity.ImageURL != nil {
		query = query.Set("image_url = ?", *entity.ImageURL)
		hasUpdates = true
	}
	if entity.Password != nil {
		query = query.Set("password = ?", *entity.Password)
		hasUpdates = true
	}
	if entity.Active != nil {
		query = query.Set("active = ?", *entity.Active)
		hasUpdates = true
	}
	if entity.TwoFASecret != nil {
		query = query.Set("twofa_secret = ?", *entity.TwoFASecret)
		hasUpdates = true
	}
	if entity.TwoFAStatus != nil {
		query = query.Set("twofa_status = ?", *entity.TwoFAStatus)
		hasUpdates = true
	}
	if entity.TwoFALastToken != nil {
		query = query.Set("twofa_last_token = ?", *entity.TwoFALastToken)
		hasUpdates = true
	}
	if entity.Role != nil {
		query = query.Set("role = ?", *entity.Role)
		hasUpdates = true
	}

	if !hasUpdates {
		return nil
	}

	// Always set updated_at
	query = query.Set("updated_at = ?", time.Now())

	_, err := query.Exec(ctx)
	return err
}
