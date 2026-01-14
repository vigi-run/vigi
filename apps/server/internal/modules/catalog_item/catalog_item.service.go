package catalog_item

import (
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreateCatalogItemDTO) (*CatalogItem, error) {
	entity := &CatalogItem{
		OrganizationID:    orgID,
		Type:              dto.Type,
		Name:              dto.Name,
		ProductKey:        dto.ProductKey,
		Notes:             dto.Notes,
		Price:             SafeFloat(dto.Price),
		Cost:              SafeFloat(dto.Cost),
		Unit:              dto.Unit,
		NcmNbs:            dto.NcmNbs,
		TaxRate:           SafeFloat(dto.TaxRate),
		InStockQuantity:   dto.InStockQuantity,
		StockNotification: dto.StockNotification,
		StockThreshold:    dto.StockThreshold,
	}

	// Business Rule: If Service, ignore stock fields
	if entity.Type == CatalogItemTypeService {
		entity.InStockQuantity = nil
		entity.StockNotification = nil
		entity.StockThreshold = nil
	}

	if err := s.repo.Create(ctx, entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*CatalogItem, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter CatalogItemFilter) ([]*CatalogItem, int, error) {
	return s.repo.GetByOrganizationID(ctx, orgID, filter)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, dto UpdateCatalogItemDTO) (*CatalogItem, error) {
	entity, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if dto.Type != nil {
		entity.Type = *dto.Type
	}
	if dto.Name != nil {
		entity.Name = *dto.Name
	}
	if dto.ProductKey != nil {
		entity.ProductKey = *dto.ProductKey
	}
	if dto.Notes != nil {
		entity.Notes = *dto.Notes
	}
	if dto.Price != nil {
		entity.Price = SafeFloat(*dto.Price)
	}
	if dto.Cost != nil {
		entity.Cost = SafeFloat(*dto.Cost)
	}
	if dto.Unit != nil {
		entity.Unit = *dto.Unit
	}
	if dto.NcmNbs != nil {
		entity.NcmNbs = *dto.NcmNbs
	}
	if dto.TaxRate != nil {
		entity.TaxRate = SafeFloat(*dto.TaxRate)
	}
	if dto.InStockQuantity != nil {
		entity.InStockQuantity = dto.InStockQuantity
	}
	if dto.StockNotification != nil {
		entity.StockNotification = dto.StockNotification
	}
	if dto.StockThreshold != nil {
		entity.StockThreshold = dto.StockThreshold
	}

	// Business Rule: If Service, ignore stock fields. verify logic if type was changed or if it was already service
	if entity.Type == CatalogItemTypeService {
		entity.InStockQuantity = nil
		entity.StockNotification = nil
		entity.StockThreshold = nil
	} else if entity.Type == CatalogItemTypeProduct {
		// If switching to Product, we might want to ensure stock fields are initialized if they were nil?
		// For now, let's leave them as is (nil means unknown or 0 depending on interpretation, but prompt said "ignore or null for service").
		// If user passes them in UpdateDTO, they will be set.
	}

	if err := s.repo.Update(ctx, entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
