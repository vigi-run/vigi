---
description: Backend implementation for new CRUD modules (Go + Gin + Bun ORM)
---
# Backend CRUD Module Implementation

## Directory Structure

```
apps/server/internal/modules/<module_name>/
├── <module_name>.model.go       # Entity definition with Bun ORM tags
├── <module_name>.dto.go         # DTOs: CreateDTO, UpdateDTO, FilterDTO
├── <module_name>.repository.go  # Repository interface
├── <module_name>.sql.repository.go  # SQL implementation
├── <module_name>.service.go     # Business logic
├── <module_name>.controller.go  # HTTP handlers
├── <module_name>.route.go       # Route registration
└── <module_name>.dig.go         # Dependency injection
```

---

## 1. Model (`<module_name>.model.go`)

```go
package <module_name>

import (
    "context"
    "time"
    "github.com/google/uuid"
    "github.com/uptrace/bun"
)

// Status enum
type <EntityName>Status string

const (
    <EntityName>StatusActive   <EntityName>Status = "active"
    <EntityName>StatusInactive <EntityName>Status = "inactive"
    <EntityName>StatusBlocked  <EntityName>Status = "blocked"
)

type <EntityName> struct {
    bun.BaseModel `bun:"table:<table_name>,alias:<alias>"`

    ID             uuid.UUID          `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
    OrganizationID uuid.UUID          `bun:"organization_id,type:uuid" json:"organizationId"`
    Name           string             `bun:"name,notnull" json:"name"`
    Status         <EntityName>Status `bun:"status,notnull,default:'active'" json:"status"`
    CreatedAt      time.Time          `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"createdAt"`
    UpdatedAt      time.Time          `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updatedAt"`
}

// Auto-generate UUID and timestamps
var _ bun.BeforeAppendModelHook = (*<EntityName>)(nil)

func (e *<EntityName>) BeforeAppendModel(ctx context.Context, query bun.Query) error {
    switch query.(type) {
    case *bun.InsertQuery:
        if e.ID == uuid.Nil {
            e.ID = uuid.New()
        }
        e.CreatedAt = time.Now()
        e.UpdatedAt = time.Now()
    case *bun.UpdateQuery:
        e.UpdatedAt = time.Now()
    }
    return nil
}
```

---

## 2. DTOs (`<module_name>.dto.go`)

```go
package <module_name>

type Create<EntityName>DTO struct {
    Name   string             `json:"name" validate:"required,min=1,max=255"`
    Status <EntityName>Status `json:"status" validate:"omitempty,oneof=active inactive blocked"`
}

type Update<EntityName>DTO struct {
    Name   *string             `json:"name" validate:"omitempty,min=1,max=255"`
    Status *<EntityName>Status `json:"status" validate:"omitempty,oneof=active inactive blocked"`
}

// Filter for pagination and filtering
type <EntityName>Filter struct {
    Limit  int     `form:"limit"`
    Page   int     `form:"page"`
    Search *string `form:"q"`
    Status *string `form:"status"`
}
```

---

## 3. Repository Interface (`<module_name>.repository.go`)

```go
package <module_name>

import (
    "context"
    "github.com/google/uuid"
)

type Repository interface {
    Create(ctx context.Context, entity *<EntityName>) error
    GetByID(ctx context.Context, id uuid.UUID) (*<EntityName>, error)
    GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter <EntityName>Filter) ([]*<EntityName>, int, error)
    Update(ctx context.Context, entity *<EntityName>) error
    Delete(ctx context.Context, id uuid.UUID) error
}
```

---

## 4. SQL Repository (`<module_name>.sql.repository.go`)

> [!CAUTION]
> **SQLite does NOT support `ILIKE`!** Use `LOWER(column) LIKE LOWER(?)` for case-insensitive search.

```go
func (r *SQLRepository) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter <EntityName>Filter) ([]*<EntityName>, int, error) {
    var entities []*<EntityName>
    query := r.db.NewSelect().Model(&entities).Where("organization_id = ?", orgID)

    // Case-insensitive search (SQLite compatible)
    if filter.Search != nil && *filter.Search != "" {
        query.Where("LOWER(name) LIKE LOWER(?)", "%"+*filter.Search+"%")
    }

    if filter.Status != nil && *filter.Status != "" {
        query.Where("status = ?", *filter.Status)
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
```

---

## 5. Service (`<module_name>.service.go`)

```go
func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto Create<EntityName>DTO) (*<EntityName>, error) {
    entity := &<EntityName>{
        OrganizationID: orgID,
        Name:           dto.Name,
        Status:         <EntityName>StatusActive,
    }
    if err := s.repo.Create(ctx, entity); err != nil {
        return nil, err
    }
    return entity, nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, dto Update<EntityName>DTO) (*<EntityName>, error) {
    entity, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }

    if dto.Name != nil {
        entity.Name = *dto.Name
    }
    if dto.Status != nil {
        entity.Status = *dto.Status
    }

    if err := s.repo.Update(ctx, entity); err != nil {
        return nil, err
    }
    return entity, nil
}
```

---

## 6. Controller (`<module_name>.controller.go`)

```go
func (c *Controller) GetByOrganizationID(ctx *gin.Context) {
    orgID := ctx.MustGet("orgId").(uuid.UUID)

    var pagination utils.PaginatedQueryParams
    ctx.ShouldBindQuery(&pagination)

    if pagination.Page == 0 { pagination.Page = 1 }
    if pagination.Limit == 0 { pagination.Limit = 10 }

    filter := <EntityName>Filter{
        Page:  pagination.Page,
        Limit: pagination.Limit,
    }

    if search := ctx.Query("q"); search != "" {
        filter.Search = &search
    }
    if status := ctx.Query("status"); status != "" {
        filter.Status = &status
    }

    entities, count, err := c.service.GetByOrganizationID(ctx, orgID, filter)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
        return
    }

    response := utils.NewPaginatedResponse(entities, count, pagination.Page, pagination.Limit)
    ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", response))
}
```

---

## 7. Routes (`<module_name>.route.go`)

```go
func (r *Route) ConnectRoute(router *gin.RouterGroup, authChain *middleware.AuthChain) {
    // Organization-scoped routes
    orgGroup := router.Group("/organizations/:id")
    orgGroup.Use(authChain.AllAuth())
    {
        orgGroup.POST("/<module_name>s", r.controller.Create)
        orgGroup.GET("/<module_name>s", r.controller.GetByOrganizationID)
    }

    // Entity routes
    entityGroup := router.Group("/<module_name>s")
    entityGroup.Use(authChain.AllAuth())
    {
        entityGroup.GET("/:id", r.controller.GetByID)
        entityGroup.PATCH("/:id", r.controller.Update)
        entityGroup.DELETE("/:id", r.controller.Delete)
    }
}
```

---

## 8. Database Migration

Create in `apps/server/cmd/bun/migrations/`:

```sql
--bun:split
CREATE TABLE <table_name> (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX <table_name>_organization_id_idx ON <table_name> (organization_id);
```

**Run:** `make migrate-up`

---

## Common Issues

| Error | Solution |
|-------|----------|
| `ILIKE` syntax error | Use `LOWER(col) LIKE LOWER(?)` |
| `no such column` | Create migration with `ALTER TABLE ADD COLUMN` |
| UUID not generating | Implement `BeforeAppendModel` hook |
