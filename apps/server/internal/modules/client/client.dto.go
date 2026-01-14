package client

type CreateClientDTO struct {
	Name           string               `json:"name" validate:"required"`
	IDNumber       *string              `json:"idNumber"`
	VATNumber      *string              `json:"vatNumber"`
	Address1       *string              `json:"address1"`
	AddressNumber  *string              `json:"addressNumber"`
	Address2       *string              `json:"address2"`
	City           *string              `json:"city"`
	State          *string              `json:"state"`
	PostalCode     *string              `json:"postalCode"`
	CustomValue1   *float64             `json:"customValue1"`
	Classification ClientClassification `json:"classification" validate:"required,oneof=individual company"`
	Status         ClientStatus         `json:"status" validate:"omitempty,oneof=active inactive blocked"`
}

type UpdateClientDTO struct {
	Name           *string               `json:"name"`
	IDNumber       *string               `json:"idNumber"`
	VATNumber      *string               `json:"vatNumber"`
	Address1       *string               `json:"address1"`
	AddressNumber  *string               `json:"addressNumber"`
	Address2       *string               `json:"address2"`
	City           *string               `json:"city"`
	State          *string               `json:"state"`
	PostalCode     *string               `json:"postalCode"`
	CustomValue1   *float64              `json:"customValue1"`
	Classification *ClientClassification `json:"classification" validate:"omitempty,oneof=individual company"`
	Status         *ClientStatus         `json:"status" validate:"omitempty,oneof=active inactive blocked"`
}

type ClientFilter struct {
	Limit          int     `form:"limit"`
	Page           int     `form:"page"`
	Search         *string `form:"q"`
	Classification *string `form:"classification"`
	Status         *string `form:"status"`
}
