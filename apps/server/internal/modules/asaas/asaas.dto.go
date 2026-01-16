package asaas

type CreateAsaasConfigDTO struct {
	ApiKey      string `json:"apiKey" validate:"required"`
	Environment string `json:"environment" validate:"required,oneof=sandbox production"`
}

type UpdateAsaasConfigDTO struct {
	ApiKey      *string `json:"apiKey"`
	Environment *string `json:"environment" validate:"omitempty,oneof=sandbox production"`
}

type GenerateChargeDTO struct {
	InvoiceID string `json:"invoiceId" validate:"required"`
}
