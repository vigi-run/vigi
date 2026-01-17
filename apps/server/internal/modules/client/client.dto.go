package client

type ClientContactDTO struct {
	Name  string  `json:"name" validate:"required"`
	Email *string `json:"email"`
	Phone *string `json:"phone"`
	Role  *string `json:"role"`
}

type CreateClientDTO struct {
	Name           string               `json:"name" validate:"required"`
	Classification ClientClassification `json:"classification" validate:"required,oneof=individual company"`
	IDNumber       *string              `json:"idNumber"`
	VATNumber      *string              `json:"vatNumber"`
	Address1       *string              `json:"address1"`
	AddressNumber  *string              `json:"addressNumber"`
	Address2       *string              `json:"address2"`
	Neighborhood   *string              `json:"neighborhood"`
	City           *string              `json:"city"`
	State          *string              `json:"state"`
	PostalCode     *string              `json:"postalCode"`
	CustomValue1   *float64             `json:"customValue1"`
	Contacts       []ClientContactDTO   `json:"contacts" validate:"dive"`
}

type UpdateClientDTO struct {
	Name           *string               `json:"name"`
	Classification *ClientClassification `json:"classification" validate:"omitempty,oneof=individual company"`
	IDNumber       *string               `json:"idNumber"`
	VATNumber      *string               `json:"vatNumber"`
	Address1       *string               `json:"address1"`
	AddressNumber  *string               `json:"addressNumber"`
	Address2       *string               `json:"address2"`
	Neighborhood   *string               `json:"neighborhood"`
	City           *string               `json:"city"`
	State          *string               `json:"state"`
	PostalCode     *string               `json:"postalCode"`
	CustomValue1   *float64              `json:"customValue1"`
	Status         *ClientStatus         `json:"status" validate:"omitempty,oneof=active inactive blocked"`
	Contacts       []ClientContactDTO    `json:"contacts" validate:"dive"`
}

type ClientFilter struct {
	Limit          int     `form:"limit"`
	Page           int     `form:"page"`
	Search         *string `form:"q"`
	Classification *string `form:"classification"`
	Status         *string `form:"status"`
}
