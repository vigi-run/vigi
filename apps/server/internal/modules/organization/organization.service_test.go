package organization

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

type MockOrganizationRepository struct {
	mock.Mock
}

func (m *MockOrganizationRepository) Create(ctx context.Context, organization *Organization) (*Organization, error) {
	args := m.Called(ctx, organization)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Organization), args.Error(1)
}

func (m *MockOrganizationRepository) FindByID(ctx context.Context, id string) (*Organization, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*Organization), args.Error(1)
}

func (m *MockOrganizationRepository) Update(ctx context.Context, id string, organization *Organization) error {
	args := m.Called(ctx, id, organization)
	return args.Error(0)
}

func (m *MockOrganizationRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockOrganizationRepository) AddMember(ctx context.Context, orgUser *OrganizationUser) error {
	args := m.Called(ctx, orgUser)
	return args.Error(0)
}

func (m *MockOrganizationRepository) RemoveMember(ctx context.Context, orgID, userID string) error {
	args := m.Called(ctx, orgID, userID)
	return args.Error(0)
}

func (m *MockOrganizationRepository) UpdateMemberRole(ctx context.Context, orgID, userID string, role Role) error {
	args := m.Called(ctx, orgID, userID, role)
	return args.Error(0)
}

func (m *MockOrganizationRepository) FindMembers(ctx context.Context, orgID string) ([]*OrganizationUser, error) {
	args := m.Called(ctx, orgID)
	return args.Get(0).([]*OrganizationUser), args.Error(1)
}

func (m *MockOrganizationRepository) FindUserOrganizations(ctx context.Context, userID string) ([]*OrganizationUser, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]*OrganizationUser), args.Error(1)
}

func (m *MockOrganizationRepository) FindMembership(ctx context.Context, orgID, userID string) (*OrganizationUser, error) {
	args := m.Called(ctx, orgID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*OrganizationUser), args.Error(1)
}

func (m *MockOrganizationRepository) FindBySlug(ctx context.Context, slug string) (*Organization, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Organization), args.Error(1)
}

func (m *MockOrganizationRepository) CreateInvitation(ctx context.Context, invitation *Invitation) error {
	args := m.Called(ctx, invitation)
	return args.Error(0)
}

func (m *MockOrganizationRepository) FindInvitations(ctx context.Context, orgID string) ([]*Invitation, error) {
	args := m.Called(ctx, orgID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*Invitation), args.Error(1)
}

func (m *MockOrganizationRepository) FindInvitationByToken(ctx context.Context, token string) (*Invitation, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Invitation), args.Error(1)
}

func (m *MockOrganizationRepository) FindInvitationsByEmail(ctx context.Context, email string) ([]*Invitation, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*Invitation), args.Error(1)
}

func (m *MockOrganizationRepository) UpdateInvitationStatus(ctx context.Context, id string, status InvitationStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockOrganizationRepository) FindAll(ctx context.Context) ([]*Organization, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*Organization), args.Error(1)
}

func (m *MockOrganizationRepository) FindAllCount(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func setupService() (*ServiceImpl, *MockOrganizationRepository) {
	mockRepo := &MockOrganizationRepository{}
	logger := zap.NewNop().Sugar()
	service := NewService(mockRepo, logger).(*ServiceImpl)
	return service, mockRepo
}

func TestOrganizationService_Create(t *testing.T) {
	ctx := context.Background()

	t.Run("successful creation", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &CreateOrganizationDto{
			Name: "Test Org",
		}
		creatorID := "user123"

		expectedOrg := &Organization{
			ID:        "org123",
			Name:      dto.Name,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Mock FindBySlug to return nil (slug not found = available)
		mockRepo.On("FindBySlug", ctx, mock.AnythingOfType("string")).Return((*Organization)(nil), nil)

		mockRepo.On("Create", ctx, mock.MatchedBy(func(o *Organization) bool {
			return o.Name == dto.Name
		})).Return(expectedOrg, nil)

		mockRepo.On("AddMember", ctx, mock.MatchedBy(func(ou *OrganizationUser) bool {
			return ou.OrganizationID == expectedOrg.ID &&
				ou.UserID == creatorID &&
				ou.Role == RoleAdmin
		})).Return(nil)

		result, err := service.Create(ctx, dto, creatorID)

		assert.NoError(t, err)
		assert.Equal(t, expectedOrg, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("rollback on member add failure", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &CreateOrganizationDto{Name: "Fail Org"}
		creatorID := "user123"

		expectedOrg := &Organization{ID: "org123", Name: "Fail Org"}

		// Mock FindBySlug to return nil (slug not found = available)
		mockRepo.On("FindBySlug", ctx, mock.AnythingOfType("string")).Return((*Organization)(nil), nil)
		mockRepo.On("Create", ctx, mock.Anything).Return(expectedOrg, nil)
		mockRepo.On("AddMember", ctx, mock.Anything).Return(assert.AnError)
		mockRepo.On("Delete", ctx, expectedOrg.ID).Return(nil)

		result, err := service.Create(ctx, dto, creatorID)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindByID(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedOrg := &Organization{
			ID:   "org123",
			Name: "Test Org",
			Slug: "test-org",
		}

		mockRepo.On("FindByID", ctx, "org123").Return(expectedOrg, nil)

		result, err := service.FindByID(ctx, "org123")

		assert.NoError(t, err)
		assert.Equal(t, expectedOrg, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindByID", ctx, "org123").Return((*Organization)(nil), assert.AnError)

		result, err := service.FindByID(ctx, "org123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindBySlug(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedOrg := &Organization{
			ID:   "org123",
			Name: "Test Org",
			Slug: "test-org",
		}

		mockRepo.On("FindBySlug", ctx, "test-org").Return(expectedOrg, nil)

		result, err := service.FindBySlug(ctx, "test-org")

		assert.NoError(t, err)
		assert.Equal(t, expectedOrg, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindBySlug", ctx, "nonexistent").Return((*Organization)(nil), nil)

		result, err := service.FindBySlug(ctx, "nonexistent")

		assert.NoError(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_Update(t *testing.T) {
	ctx := context.Background()

	t.Run("successful update with name", func(t *testing.T) {
		service, mockRepo := setupService()
		orgID := "org123"
		newName := "Updated Org"
		dto := &UpdateOrganizationDto{Name: &newName}

		existingOrg := &Organization{ID: orgID, Name: "Old Name", Slug: "old-slug"}
		mockRepo.On("FindByID", ctx, orgID).Return(existingOrg, nil)
		mockRepo.On("Update", ctx, orgID, mock.MatchedBy(func(o *Organization) bool {
			return o.Name == newName && o.Slug == "old-slug"
		})).Return(nil)

		result, err := service.Update(ctx, orgID, dto)

		assert.NoError(t, err)
		assert.Equal(t, newName, result.Name)
		mockRepo.AssertExpectations(t)
	})

	t.Run("successful update with slug", func(t *testing.T) {
		service, mockRepo := setupService()
		orgID := "org123"
		newSlug := "new-slug"
		dto := &UpdateOrganizationDto{Slug: &newSlug}

		existingOrg := &Organization{ID: orgID, Name: "Test Org", Slug: "old-slug"}
		mockRepo.On("FindByID", ctx, orgID).Return(existingOrg, nil)
		mockRepo.On("FindBySlug", ctx, newSlug).Return((*Organization)(nil), nil)
		mockRepo.On("Update", ctx, orgID, mock.MatchedBy(func(o *Organization) bool {
			return o.Slug == newSlug
		})).Return(nil)

		result, err := service.Update(ctx, orgID, dto)

		assert.NoError(t, err)
		assert.Equal(t, newSlug, result.Slug)
		mockRepo.AssertExpectations(t)
	})

	t.Run("slug already used", func(t *testing.T) {
		service, mockRepo := setupService()
		orgID := "org123"
		newSlug := "existing-slug"
		dto := &UpdateOrganizationDto{Slug: &newSlug}

		existingOrg := &Organization{ID: orgID, Name: "Test Org", Slug: "old-slug"}
		conflictOrg := &Organization{ID: "OTHER_ID", Slug: newSlug}

		mockRepo.On("FindByID", ctx, orgID).Return(existingOrg, nil)
		mockRepo.On("FindBySlug", ctx, newSlug).Return(conflictOrg, nil)

		result, err := service.Update(ctx, orgID, dto)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("successful delete", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("Delete", ctx, "org123").Return(nil)

		err := service.Delete(ctx, "org123")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("Delete", ctx, "org123").Return(assert.AnError)

		err := service.Delete(ctx, "org123")

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_AddMember(t *testing.T) {
	ctx := context.Background()

	t.Run("successful invitation creation", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &AddMemberDto{
			Email: "user@example.com",
			Role:  RoleMember,
		}

		mockRepo.On("CreateInvitation", ctx, mock.MatchedBy(func(inv *Invitation) bool {
			return inv.OrganizationID == "org123" &&
				inv.Email == dto.Email &&
				inv.Role == dto.Role &&
				inv.Status == InvitationStatusPending &&
				inv.Token != ""
		})).Return(nil)

		result, err := service.AddMember(ctx, "org123", dto)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "org123", result.OrganizationID)
		assert.Equal(t, dto.Email, result.Email)
		assert.Equal(t, dto.Role, result.Role)
		assert.Equal(t, InvitationStatusPending, result.Status)
		assert.NotEmpty(t, result.Token)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &AddMemberDto{Email: "user@example.com", Role: RoleMember}

		mockRepo.On("CreateInvitation", ctx, mock.Anything).Return(assert.AnError)

		result, err := service.AddMember(ctx, "org123", dto)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_RemoveMember(t *testing.T) {
	ctx := context.Background()

	t.Run("successful removal", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("RemoveMember", ctx, "org123", "user123").Return(nil)

		err := service.RemoveMember(ctx, "org123", "user123")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("RemoveMember", ctx, "org123", "user123").Return(assert.AnError)

		err := service.RemoveMember(ctx, "org123", "user123")

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_UpdateMemberRole(t *testing.T) {
	ctx := context.Background()

	t.Run("successful role update", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &UpdateMemberRoleDto{Role: RoleAdmin}
		mockRepo.On("UpdateMemberRole", ctx, "org123", "user123", RoleAdmin).Return(nil)

		err := service.UpdateMemberRole(ctx, "org123", "user123", dto)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		dto := &UpdateMemberRoleDto{Role: RoleAdmin}
		mockRepo.On("UpdateMemberRole", ctx, "org123", "user123", RoleAdmin).Return(assert.AnError)

		err := service.UpdateMemberRole(ctx, "org123", "user123", dto)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindMembers(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find with members", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedMembers := []*OrganizationUser{
			{OrganizationID: "org123", UserID: "user1", Role: RoleAdmin},
			{OrganizationID: "org123", UserID: "user2", Role: RoleMember},
		}

		mockRepo.On("FindMembers", ctx, "org123").Return(expectedMembers, nil)

		result, err := service.FindMembers(ctx, "org123")

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, expectedMembers, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindMembers", ctx, "org123").Return(([]*OrganizationUser)(nil), assert.AnError)

		result, err := service.FindMembers(ctx, "org123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindUserOrganizations(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedOrgs := []*OrganizationUser{
			{OrganizationID: "org1", UserID: "user123", Role: RoleAdmin},
			{OrganizationID: "org2", UserID: "user123", Role: RoleMember},
		}

		mockRepo.On("FindUserOrganizations", ctx, "user123").Return(expectedOrgs, nil)

		result, err := service.FindUserOrganizations(ctx, "user123")

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindUserOrganizations", ctx, "user123").Return(([]*OrganizationUser)(nil), assert.AnError)

		result, err := service.FindUserOrganizations(ctx, "user123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindMembership(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedMembership := &OrganizationUser{
			OrganizationID: "org123",
			UserID:         "user123",
			Role:           RoleAdmin,
		}

		mockRepo.On("FindMembership", ctx, "org123", "user123").Return(expectedMembership, nil)

		result, err := service.FindMembership(ctx, "org123", "user123")

		assert.NoError(t, err)
		assert.Equal(t, expectedMembership, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindMembership", ctx, "org123", "user123").Return((*OrganizationUser)(nil), assert.AnError)

		result, err := service.FindMembership(ctx, "org123", "user123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_FindInvitations(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedInvitations := []*Invitation{
			{ID: "inv1", OrganizationID: "org123", Email: "user1@example.com", Status: InvitationStatusPending},
			{ID: "inv2", OrganizationID: "org123", Email: "user2@example.com", Status: InvitationStatusPending},
		}

		mockRepo.On("FindInvitations", ctx, "org123").Return(expectedInvitations, nil)

		result, err := service.FindInvitations(ctx, "org123")

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindInvitations", ctx, "org123").Return(([]*Invitation)(nil), assert.AnError)

		result, err := service.FindInvitations(ctx, "org123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_GetInvitation(t *testing.T) {
	ctx := context.Background()

	t.Run("successful get valid invitation", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			ID:        "inv123",
			Token:     "token123",
			Status:    InvitationStatusPending,
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)

		result, err := service.GetInvitation(ctx, "token123")

		assert.NoError(t, err)
		assert.Equal(t, invitation, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invitation already accepted", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			Status:    InvitationStatusAccepted,
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)

		result, err := service.GetInvitation(ctx, "token123")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "not pending")
		mockRepo.AssertExpectations(t)
	})

	t.Run("invitation expired", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			Status:    InvitationStatusPending,
			ExpiresAt: time.Now().Add(-24 * time.Hour), // expired
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)

		result, err := service.GetInvitation(ctx, "token123")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "expired")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindInvitationByToken", ctx, "token123").Return((*Invitation)(nil), assert.AnError)

		result, err := service.GetInvitation(ctx, "token123")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_AcceptInvitation(t *testing.T) {
	ctx := context.Background()

	t.Run("successful acceptance", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			ID:             "inv123",
			OrganizationID: "org123",
			Email:          "user@example.com",
			Role:           RoleMember,
			Status:         InvitationStatusPending,
			ExpiresAt:      time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)
		mockRepo.On("AddMember", ctx, mock.MatchedBy(func(ou *OrganizationUser) bool {
			return ou.OrganizationID == "org123" &&
				ou.UserID == "user123" &&
				ou.Role == RoleMember
		})).Return(nil)
		mockRepo.On("UpdateInvitationStatus", ctx, "inv123", InvitationStatusAccepted).Return(nil)

		err := service.AcceptInvitation(ctx, "token123", "user123")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invitation not pending", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			Status:    InvitationStatusAccepted,
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)

		err := service.AcceptInvitation(ctx, "token123", "user123")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid")
		mockRepo.AssertExpectations(t)
	})

	t.Run("invitation expired", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			Status:    InvitationStatusPending,
			ExpiresAt: time.Now().Add(-24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)

		err := service.AcceptInvitation(ctx, "token123", "user123")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "expired")
		mockRepo.AssertExpectations(t)
	})

	t.Run("add member fails", func(t *testing.T) {
		service, mockRepo := setupService()
		invitation := &Invitation{
			ID:             "inv123",
			OrganizationID: "org123",
			Role:           RoleMember,
			Status:         InvitationStatusPending,
			ExpiresAt:      time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("FindInvitationByToken", ctx, "token123").Return(invitation, nil)
		mockRepo.On("AddMember", ctx, mock.Anything).Return(assert.AnError)

		err := service.AcceptInvitation(ctx, "token123", "user123")

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrganizationService_GetUserInvitations(t *testing.T) {
	ctx := context.Background()

	t.Run("successful find", func(t *testing.T) {
		service, mockRepo := setupService()
		expectedInvitations := []*Invitation{
			{ID: "inv1", Email: "user@example.com", Status: InvitationStatusPending},
			{ID: "inv2", Email: "user@example.com", Status: InvitationStatusPending},
		}

		mockRepo.On("FindInvitationsByEmail", ctx, "user@example.com").Return(expectedInvitations, nil)

		result, err := service.GetUserInvitations(ctx, "user@example.com")

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		service, mockRepo := setupService()
		mockRepo.On("FindInvitationsByEmail", ctx, "user@example.com").Return(([]*Invitation)(nil), assert.AnError)

		result, err := service.GetUserInvitations(ctx, "user@example.com")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}
