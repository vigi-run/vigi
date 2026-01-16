package recurring_invoice

import (
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreateRecurringInvoiceDTO) (*RecurringInvoice, error) {
	var total float64
	items := make([]*RecurringInvoiceItem, 0, len(dto.Items))

	for _, itemDTO := range dto.Items {
		itemTotal := (itemDTO.Quantity * itemDTO.UnitPrice) - itemDTO.Discount
		if itemTotal < 0 {
			itemTotal = 0
		}
		total += itemTotal
		items = append(items, &RecurringInvoiceItem{
			CatalogItemID: itemDTO.CatalogItemID,
			Description:   itemDTO.Description,
			Quantity:      SafeFloat(itemDTO.Quantity),
			UnitPrice:     SafeFloat(itemDTO.UnitPrice),
			Discount:      SafeFloat(itemDTO.Discount),
			Total:         SafeFloat(itemTotal),
		})
	}

	total -= dto.Discount
	if total < 0 {
		total = 0
	}

	entity := &RecurringInvoice{
		OrganizationID:     orgID,
		ClientID:           dto.ClientID,
		Number:             dto.Number,
		Status:             RecurringInvoiceStatusActive,
		NextGenerationDate: dto.NextGenerationDate,
		Date:               dto.Date,
		DueDate:            dto.DueDate,
		Terms:              dto.Terms,
		Notes:              dto.Notes,
		Total:              SafeFloat(total),
		Discount:           SafeFloat(dto.Discount),
		Items:              items,
	}

	if err := s.repo.Create(ctx, entity); err != nil {
		return nil, err
	}

	return entity, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*RecurringInvoice, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter RecurringInvoiceFilter) ([]*RecurringInvoice, int, error) {
	return s.repo.GetByOrganizationID(ctx, orgID, filter)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, dto UpdateRecurringInvoiceDTO) (*RecurringInvoice, error) {
	entity, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if dto.ClientID != nil {
		entity.ClientID = *dto.ClientID
	}
	if dto.Number != nil {
		entity.Number = *dto.Number
	}
	if dto.Status != nil {
		entity.Status = *dto.Status
	}
	if dto.NextGenerationDate != nil {
		entity.NextGenerationDate = dto.NextGenerationDate
	}
	if dto.Date != nil {
		entity.Date = dto.Date
	}
	if dto.DueDate != nil {
		entity.DueDate = dto.DueDate
	}
	if dto.Terms != nil {
		entity.Terms = *dto.Terms
	}
	if dto.Notes != nil {
		entity.Notes = *dto.Notes
	}

	if dto.Discount != nil {
		entity.Discount = SafeFloat(*dto.Discount)
	}

	if dto.Items != nil {
		var total float64
		items := make([]*RecurringInvoiceItem, 0, len(dto.Items))

		for _, itemDTO := range dto.Items {
			itemTotal := (itemDTO.Quantity * itemDTO.UnitPrice) - itemDTO.Discount
			if itemTotal < 0 {
				itemTotal = 0
			}
			total += itemTotal
			items = append(items, &RecurringInvoiceItem{
				CatalogItemID: itemDTO.CatalogItemID,
				Description:   itemDTO.Description,
				Quantity:      SafeFloat(itemDTO.Quantity),
				UnitPrice:     SafeFloat(itemDTO.UnitPrice),
				Discount:      SafeFloat(itemDTO.Discount),
				Total:         SafeFloat(itemTotal),
			})
		}

		if dto.Discount != nil {
			total -= *dto.Discount
		} else {
			total -= float64(entity.Discount)
		}

		if total < 0 {
			total = 0
		}

		entity.Items = items
		entity.Total = SafeFloat(total)
	} else if dto.Discount != nil {
		var itemsTotal float64
		if entity.Items != nil {
			for _, item := range entity.Items {
				itemsTotal += float64(item.Total)
			}
		}

		total := itemsTotal - *dto.Discount
		if total < 0 {
			total = 0
		}
		entity.Total = SafeFloat(total)
	}

	if err := s.repo.Update(ctx, entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
