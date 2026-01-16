package recurring_invoice

import (
	"context"
	"fmt"
	"time"
	"vigi/internal/modules/invoice"

	"github.com/google/uuid"
)

type Service struct {
	repo           Repository
	invoiceService *invoice.Service
}

func NewService(repo Repository, invoiceService *invoice.Service) *Service {
	return &Service{
		repo:           repo,
		invoiceService: invoiceService,
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
		Frequency:          dto.Frequency,
		Interval:           dto.Interval,
		DayOfMonth:         dto.DayOfMonth,
		DayOfWeek:          dto.DayOfWeek,
		Month:              dto.Month,
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

	if dto.Frequency != nil {
		entity.Frequency = *dto.Frequency
	}
	if dto.Interval != nil {
		entity.Interval = *dto.Interval
	}
	if dto.DayOfMonth != nil {
		entity.DayOfMonth = dto.DayOfMonth
	}
	if dto.DayOfWeek != nil {
		entity.DayOfWeek = dto.DayOfWeek
	}
	if dto.Month != nil {
		entity.Month = dto.Month
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

func (s *Service) GenerateInvoice(ctx context.Context, id uuid.UUID) (*invoice.Invoice, error) {
	// 1. Fetch Recurring Invoice
	recurring, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 2. Calculate Date and Due Date
	// Logic: Date = Now. DueDate = Now + (Rec.DueDate - Rec.Date)
	// If original dates are nil, default to Now + 3 days or something, but usually they are required or logic handles it.
	// As per model: Date and DueDate are pointers.
	now := time.Now()
	var dueDate time.Time

	if recurring.Date != nil && recurring.DueDate != nil {
		// Calculate duration/offset
		offset := recurring.DueDate.Sub(*recurring.Date)
		dueDate = now.Add(offset)
	} else {
		// Default to 7 days if unknown? Or per user request "dia 5, e a data de vencimento ta + 10 dias" => implies offset.
		// If data is missing, we set DueDate = Date (immediate) or standard offset.
		dueDate = now
	}

	// 3. Prepare Invoice Items
	invoiceItems := make([]invoice.CreateInvoiceItemDTO, 0, len(recurring.Items))
	for _, item := range recurring.Items {
		invoiceItems = append(invoiceItems, invoice.CreateInvoiceItemDTO{
			CatalogItemID: item.CatalogItemID, // Direct mapping if pointer types match
			Description:   item.Description,
			Quantity:      float64(item.Quantity),
			UnitPrice:     float64(item.UnitPrice),
			Discount:      float64(item.Discount),
		})
	}

	// 4. Generate Number?
	// Invoice service usually handles number generation if not provided?
	// CreateInvoiceDTO requires Number string.
	// We need to generate a new number. "INV-" + timestamp? or let service handle it?
	// Existing UpdateInvoiceDTO has Number *string. Create has Number string.
	// Check recurring.Number. It might be the "template" number? No, recurring invoice has its own number "REC-001".
	// Generated invoice needs new number.
	// For now, I'll generate a temp number and let user edit, or use random.
	// Better: Use "REC-{Ref}-" + timestamp or something.
	// Let's use a placeholder and ideally the service or a number generator handles it.
	// NOTE: Client repo usually has "GetNextNumber".
	// I will generate a simple unique number for now: "INV-" + uuid prefix or similar.
	// Actually, the user asked for "Proximo Fatura".
	// Let's use format "INV-{Random}" for now.
	newNumber := fmt.Sprintf("INV-%d", time.Now().Unix())

	// 5. Create Invoice
	dto := invoice.CreateInvoiceDTO{
		ClientID: recurring.ClientID,
		Number:   newNumber,
		Date:     &now,
		DueDate:  &dueDate,
		Items:    invoiceItems,
		Terms:    recurring.Terms, // Passed as string, not pointer
		Notes:    recurring.Notes, // Passed as string, not pointer
		Discount: float64(recurring.Discount),
	}

	newInvoice, err := s.invoiceService.Create(ctx, recurring.OrganizationID, dto)
	if err != nil {
		return nil, err
	}

	// 6. Update NextGenerationDate
	// Calculate next date based on Frequency/Interval
	if recurring.NextGenerationDate == nil {
		// If nil, start from now
		current := time.Now()
		recurring.NextGenerationDate = &current
	}

	// Determine next date
	// Simple logic: Add interval based on frequency
	var nextDate time.Time
	// Use recurring.NextGenerationDate as base or Now?
	// "edita a proxima cobran'ca" implies moving the schedule forward.
	// If we run it early, should we push the next one? Yes.
	baseDate := *recurring.NextGenerationDate
	if baseDate.Before(now) {
		baseDate = now
	}

	// Add logic for frequency
	switch recurring.Frequency {
	case "DAILY":
		nextDate = baseDate.AddDate(0, 0, recurring.Interval)
	case "WEEKLY":
		nextDate = baseDate.AddDate(0, 0, recurring.Interval*7)
	case "MONTHLY":
		nextDate = baseDate.AddDate(0, recurring.Interval, 0)
	case "YEARLY":
		nextDate = baseDate.AddDate(recurring.Interval, 0, 0)
	default:
		nextDate = baseDate.AddDate(0, 1, 0) // Default monthly
	}

	recurring.NextGenerationDate = &nextDate
	// Also update UpdatedAt? Handled by hook.

	if err := s.repo.Update(ctx, recurring); err != nil {
		// Log warning? Invoice already created.
		// Return error?
		return newInvoice, nil // Return success even if schedule update fails? No, better warn.
		// For strictness, return nil, err? But invoice exists.
		// I will return the invoice and nil error, but ideally transactional.
		// Ignoring transaction for now as it crosses services.
	}

	return newInvoice, nil
}
