package client

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

func (s *Service) Create(ctx context.Context, organizationID uuid.UUID, dto CreateClientDTO) (*Client, error) {
	client := &Client{
		OrganizationID: organizationID,
		Name:           dto.Name,
		IDNumber:       dto.IDNumber,
		VATNumber:      dto.VATNumber,
		Address1:       dto.Address1,
		AddressNumber:  dto.AddressNumber,
		Address2:       dto.Address2,
		City:           dto.City,
		State:          dto.State,
		PostalCode:     dto.PostalCode,
		CustomValue1:   dto.CustomValue1,
		Classification: dto.Classification,
		Status:         ClientStatusActive,
	}

	if err := s.repo.Create(ctx, client); err != nil {
		return nil, err
	}

	return client, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Client, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) GetByOrganizationID(ctx context.Context, organizationID uuid.UUID, filter ClientFilter) ([]*Client, int, error) {
	return s.repo.GetByOrganizationID(ctx, organizationID, filter)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, dto UpdateClientDTO) (*Client, error) {
	client, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if dto.Name != nil {
		client.Name = *dto.Name
	}
	if dto.IDNumber != nil {
		client.IDNumber = dto.IDNumber
	}
	if dto.VATNumber != nil {
		client.VATNumber = dto.VATNumber
	}
	if dto.Address1 != nil {
		client.Address1 = dto.Address1
	}
	if dto.AddressNumber != nil {
		client.AddressNumber = dto.AddressNumber
	}
	if dto.Address2 != nil {
		client.Address2 = dto.Address2
	}
	if dto.City != nil {
		client.City = dto.City
	}
	if dto.State != nil {
		client.State = dto.State
	}
	if dto.PostalCode != nil {
		client.PostalCode = dto.PostalCode
	}
	if dto.CustomValue1 != nil {
		client.CustomValue1 = dto.CustomValue1
	}
	if dto.Classification != nil {
		client.Classification = *dto.Classification
	}
	if dto.Status != nil {
		client.Status = *dto.Status
	}

	if err := s.repo.Update(ctx, client); err != nil {
		return nil, err
	}

	return client, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
