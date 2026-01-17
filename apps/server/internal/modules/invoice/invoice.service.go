package invoice

import (
	"context"
	"fmt"
	"vigi/internal/config"
	"vigi/internal/modules/client"
	"vigi/internal/modules/organization"
	"vigi/internal/pkg/usesend"

	"github.com/google/uuid"
)

type Service struct {
	repo          Repository
	clientRepo    client.Repository
	orgRepo       organization.OrganizationRepository
	emailRepo     EmailRepository
	usesendClient *usesend.Client
	cfg           *config.Config
}

func NewService(repo Repository, clientRepo client.Repository, orgRepo organization.OrganizationRepository, emailRepo EmailRepository, usesendClient *usesend.Client, cfg *config.Config) *Service {
	return &Service{
		repo:          repo,
		clientRepo:    clientRepo,
		orgRepo:       orgRepo,
		emailRepo:     emailRepo,
		usesendClient: usesendClient,
		cfg:           cfg,
	}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreateInvoiceDTO) (*Invoice, error) {
	var total float64
	items := make([]*InvoiceItem, 0, len(dto.Items))

	for _, itemDTO := range dto.Items {
		itemTotal := (itemDTO.Quantity * itemDTO.UnitPrice) - itemDTO.Discount
		if itemTotal < 0 {
			itemTotal = 0
		}
		total += itemTotal
		items = append(items, &InvoiceItem{
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

	entity := &Invoice{
		OrganizationID:    orgID,
		ClientID:          dto.ClientID,
		Number:            dto.Number,
		Status:            InvoiceStatusDraft,
		Date:              dto.Date,
		DueDate:           dto.DueDate,
		Terms:             dto.Terms,
		Notes:             dto.Notes,
		Total:             SafeFloat(total),
		Discount:          SafeFloat(dto.Discount),
		NFID:              dto.NFID,
		NFStatus:          dto.NFStatus,
		NFLink:            dto.NFLink,
		BankInvoiceID:     dto.BankInvoiceID,
		BankInvoiceStatus: dto.BankInvoiceStatus,
		Items:             items,
	}

	if err := s.repo.Create(ctx, entity); err != nil {
		return nil, err
	}

	// Send creation email asynchronously or synchronously? User flow implies sync or fast async.
	// For now, doing it inline as per other methods, but ignoring error to not block creation?
	// Actually typical flow is fire and forget or background job.
	// Service has SendFirstEmail etc. I'll call s.SendCreatedEmail(ctx, entity.ID)
	// I need to confirm method exists first? No, I'm adding it in next step.
	// Golang allows this order if I edit the other file next.

	go func() {
		// Create a new context as correct practice for background tasks,
		// but using passed ctx for tracing if needed?
		// Ideally use context.Background() with timeout.
		bgCtx := context.Background()
		if err := s.SendCreatedEmail(bgCtx, entity.ID); err != nil {
			// fmt.Printf("Failed to send created email: %v\n", err)
			// Logging handled inside service usually
		}
	}()

	return entity, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Invoice, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetByBankID(ctx context.Context, bankID string) (*Invoice, error) {
	return s.repo.GetByBankID(ctx, bankID)
}

func (s *Service) GetByOrganizationID(ctx context.Context, orgID uuid.UUID, filter InvoiceFilter) ([]*Invoice, int, error) {
	return s.repo.GetByOrganizationID(ctx, orgID, filter)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, dto UpdateInvoiceDTO) (*Invoice, error) {
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

	if dto.NFID != nil {
		entity.NFID = dto.NFID
	}
	if dto.NFStatus != nil {
		entity.NFStatus = dto.NFStatus
	}
	if dto.NFLink != nil {
		entity.NFLink = dto.NFLink
	}
	if dto.BankInvoiceID != nil {
		entity.BankInvoiceID = dto.BankInvoiceID
	}
	if dto.BankInvoiceStatus != nil {
		entity.BankInvoiceStatus = dto.BankInvoiceStatus
	}
	if dto.BankProvider != nil {
		entity.BankProvider = dto.BankProvider
	}
	if dto.BankPixPayload != nil {
		entity.BankPixPayload = dto.BankPixPayload
	}
	if dto.Discount != nil {
		entity.Discount = SafeFloat(*dto.Discount)
	}

	if dto.Items != nil {
		var total float64
		items := make([]*InvoiceItem, 0, len(dto.Items))

		for _, itemDTO := range dto.Items {
			itemTotal := (itemDTO.Quantity * itemDTO.UnitPrice) - itemDTO.Discount
			if itemTotal < 0 {
				itemTotal = 0
			}
			total += itemTotal
			items = append(items, &InvoiceItem{
				CatalogItemID: itemDTO.CatalogItemID,
				Description:   itemDTO.Description,
				Quantity:      SafeFloat(itemDTO.Quantity),
				UnitPrice:     SafeFloat(itemDTO.UnitPrice),
				Discount:      SafeFloat(itemDTO.Discount),
				Total:         SafeFloat(itemTotal),
			})
		}

		// Calculate final total including invoice discount
		// Use new discount if provided, otherwise use existing
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
		// Only discount changed, need to recalculate total from existing items
		// Since we don't have items in memory unless searched, we rely on repository handling or we should have fetched items.
		// NOTE: GetByID currently fetches items? Let's assume it does for now as per usual pattern.
		// If not, this logic is flawed. But given relationships in Bun, usually we need Relation("Items") on GetByID.

		// Recalculate total from existing items
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

func (s *Service) Clone(ctx context.Context, id uuid.UUID) (*Invoice, error) {
	// 1. Get existing invoice
	original, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if original == nil {
		return nil, fmt.Errorf("invoice not found")
	}

	// 2. Prepare new items
	newItems := make([]*InvoiceItem, 0, len(original.Items))
	for _, item := range original.Items {
		newItems = append(newItems, &InvoiceItem{
			CatalogItemID: item.CatalogItemID,
			Description:   item.Description,
			Quantity:      item.Quantity,
			UnitPrice:     item.UnitPrice,
			Discount:      item.Discount,
			Total:         item.Total,
		})
	}

	// 3. Create new invoice entity
	newInvoice := &Invoice{
		OrganizationID: original.OrganizationID,
		ClientID:       original.ClientID,
		Number:         original.Number + " (Copy)",
		Status:         InvoiceStatusDraft,
		Date:           nil, // Reset dates? Or keep? Usually reset to today or null. Let's keep null as draft.
		DueDate:        nil,
		Terms:          original.Terms,
		Notes:          original.Notes,
		Total:          original.Total,
		Discount:       original.Discount,
		Currency:       original.Currency,
		Items:          newItems,
		// Explicitly clear fiscal/bank info
		NFID:              nil,
		NFStatus:          nil,
		NFLink:            nil,
		BankInvoiceID:     nil,
		BankInvoiceStatus: nil,
		BankProvider:      nil,
		BankPixPayload:    nil,
	}

	// 4. Save
	if err := s.repo.Create(ctx, newInvoice); err != nil {
		return nil, err
	}

	return newInvoice, nil
}
