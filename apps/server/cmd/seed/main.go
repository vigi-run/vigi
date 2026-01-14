package main

import (
	"context"
	"fmt"
	"log"
	"time"
	"vigi/internal"
	"vigi/internal/config"
	"vigi/internal/infra"
	"vigi/internal/modules/auth"
	"vigi/internal/modules/client"
	"vigi/internal/modules/organization"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
	"go.uber.org/dig"
)

func main() {
	cfg, err := config.LoadConfig[config.Config]("../..")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	container := dig.New()

	// Provide dependencies
	container.Provide(func() *config.Config { return &cfg })
	container.Provide(internal.ProvideLogger)

	// Database provider
	switch cfg.DBType {
	case "postgres", "postgresql", "mysql", "sqlite":
		container.Provide(infra.ProvideSQLDB)
	case "mongo", "mongodb":
		container.Provide(infra.ProvideMongoDB)
	default:
		panic(fmt.Errorf("unsupported DB_DRIVER %q", cfg.DBType))
	}

	err = container.Invoke(func(db *bun.DB) error {
		ctx := context.Background()
		fmt.Println("Seeding database...")

		// 1. Create User
		userID := uuid.New().String()
		user := &auth.Model{
			ID:       userID,
			Email:    "seed@example.com",
			Name:     "Seed User",
			Password: "$2a$10$3XjX/X...dummyhash",
			Active:   true,
			// Role field does not exist in auth.Model
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		exists, err := db.NewSelect().Model((*auth.Model)(nil)).Where("email = ?", user.Email).Exists(ctx)
		if err != nil {
			return fmt.Errorf("checking user existence: %w", err)
		}

		if !exists {
			// Check if ANY user exists
			count, _ := db.NewSelect().Model((*auth.Model)(nil)).Count(ctx)
			if count == 0 {
				fmt.Println("No users found. Creating fake admin user...")
				_, err := db.NewInsert().Model(user).Exec(ctx)
				if err != nil {
					return fmt.Errorf("creating user: %w", err)
				}
				fmt.Printf("Created user: %s (%s)\n", user.Name, user.ID)
			} else {
				// Use first user found
				err := db.NewSelect().Model(user).Limit(1).Scan(ctx)
				if err != nil {
					return fmt.Errorf("fetching existing user: %w", err)
				}
				fmt.Printf("Using existing user: %s\n", user.ID)
				// Update userID for subsequent use
				userID = user.ID
			}
		} else {
			db.NewSelect().Model(user).Where("email = ?", user.Email).Scan(ctx)
			fmt.Printf("Using existing seed user: %s\n", user.ID)
			userID = user.ID
		}

		// 2. Create Organization
		orgID := uuid.New().String()
		org := &organization.Organization{
			// BaseModel does not exist in Organization model definition viewed
			ID:   orgID,
			Name: "Seed Organization",
			Slug: "seed-org",
			// OwnerID does not exist in Organization model definition viewed
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		orgExists, _ := db.NewSelect().Model((*organization.Organization)(nil)).Where("slug = ?", org.Slug).Exists(ctx)
		if !orgExists {
			_, err := db.NewInsert().Model(org).Exec(ctx)
			if err != nil {
				return fmt.Errorf("creating org: %w", err)
			}
			fmt.Printf("Created organization: %s\n", org.ID)

			// Link user to org
			member := &organization.OrganizationUser{
				OrganizationID: org.ID,
				UserID:         userID,
				Role:           "admin", // Using 'admin' based on Role constants in model
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			_, err = db.NewInsert().Model(member).Exec(ctx)
			if err != nil {
				return fmt.Errorf("creating member: %w", err)
			}
		} else {
			db.NewSelect().Model(org).Where("slug = ?", org.Slug).Scan(ctx)
			fmt.Printf("Using existing organization: %s\n", org.ID)
			orgID = org.ID
		}

		// 3. Create Clients
		// Parse IDs to UUIDs
		orgUUID, err := uuid.Parse(orgID)
		if err != nil {
			return fmt.Errorf("invalid org UUID: %w", err)
		}

		clients := []*client.Client{
			{
				ID:             uuid.New(),
				OrganizationID: orgUUID,
				Name:           "Tech Corp",
				Classification: "company",
				IDNumber:       func() *string { s := "12345678000195"; return &s }(),
				City:           func() *string { s := "São Paulo"; return &s }(),
				State:          func() *string { s := "SP"; return &s }(),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			},
			{
				ID:             uuid.New(),
				OrganizationID: orgUUID,
				Name:           "John Doe Freelancer",
				Classification: "individual",
				IDNumber:       func() *string { s := "12345678909"; return &s }(),
				City:           func() *string { s := "Rio de Janeiro"; return &s }(),
				State:          func() *string { s := "RJ"; return &s }(),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			},
			{
				ID:             uuid.New(),
				OrganizationID: orgUUID,
				Name:           "Jane Smith Consulting",
				Classification: "individual",
				IDNumber:       func() *string { s := "98765432100"; return &s }(),
				City:           func() *string { s := "Curitiba"; return &s }(),
				State:          func() *string { s := "PR"; return &s }(),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			},
			{
				ID:             uuid.New(),
				OrganizationID: orgUUID,
				Name:           "Mega Retail Ltda",
				Classification: "company",
				IDNumber:       func() *string { s := "98765432000198"; return &s }(),
				City:           func() *string { s := "Belo Horizonte"; return &s }(),
				State:          func() *string { s := "MG"; return &s }(),
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			},
		}

		_, err = db.NewInsert().Model(&clients).Exec(ctx)
		if err != nil {
			return fmt.Errorf("creating clients: %w", err)
		}

		fmt.Printf("Seeded %d clients successfully.\n", len(clients))
		return nil
	})

	if err != nil {
		log.Fatalf("Seeding failed: %v", err)
	}
}
