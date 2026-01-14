package catalog_item

type CreateCatalogItemDTO struct {
	Type       CatalogItemType `json:"type" validate:"required,oneof=PRODUCT SERVICE"`
	Name       string          `json:"name" validate:"required"`
	ProductKey string          `json:"productKey" validate:"required"`
	Notes      string          `json:"notes"`
	Price      float64         `json:"price" validate:"gte=0"`
	Cost       float64         `json:"cost" validate:"gte=0"`
	Unit       string          `json:"unit" validate:"required"`
	NcmNbs     string          `json:"ncmNbs"`
	TaxRate    float64         `json:"taxRate" validate:"gte=0"`

	InStockQuantity   *float64 `json:"inStockQuantity"`
	StockNotification *bool    `json:"stockNotification"`
	StockThreshold    *float64 `json:"stockThreshold"`
}

type UpdateCatalogItemDTO struct {
	Type       *CatalogItemType `json:"type" validate:"omitempty,oneof=PRODUCT SERVICE"`
	Name       *string          `json:"name"`
	ProductKey *string          `json:"productKey"`
	Notes      *string          `json:"notes"`
	Price      *float64         `json:"price" validate:"omitempty,gte=0"`
	Cost       *float64         `json:"cost" validate:"omitempty,gte=0"`
	Unit       *string          `json:"unit"`
	NcmNbs     *string          `json:"ncmNbs"`
	TaxRate    *float64         `json:"taxRate" validate:"omitempty,gte=0"`

	InStockQuantity   *float64 `json:"inStockQuantity"`
	StockNotification *bool    `json:"stockNotification"`
	StockThreshold    *float64 `json:"stockThreshold"`
}

type CatalogItemFilter struct {
	Limit  int              `form:"limit"`
	Page   int              `form:"page"`
	Search *string          `form:"q"`
	Type   *CatalogItemType `form:"type"`
}
