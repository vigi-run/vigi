package inter

type CreateInterConfigDTO struct {
	ClientID      string           `json:"clientId" validate:"required"`
	ClientSecret  string           `json:"clientSecret" validate:"required"`
	Certificate   string           `json:"certificate" validate:"required"`
	Key           string           `json:"key" validate:"required"`
	AccountNumber *string          `json:"accountNumber"`
	Environment   InterEnvironment `json:"environment" validate:"required,oneof=sandbox production"`
}

type UpdateInterConfigDTO struct {
	ClientID      *string           `json:"clientId"`
	ClientSecret  *string           `json:"clientSecret"`
	Certificate   *string           `json:"certificate"`
	Key           *string           `json:"key"`
	AccountNumber *string           `json:"accountNumber"`
	Environment   *InterEnvironment `json:"environment" validate:"omitempty,oneof=sandbox production"`
}

type GenerateChargeDTO struct {
	InvoiceID string `json:"invoiceId" validate:"required"`
}
