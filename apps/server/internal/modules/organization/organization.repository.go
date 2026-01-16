package organization

import (
	"context"
)

type OrganizationRepository interface {
	Create(ctx context.Context, organization *Organization) (*Organization, error)
	FindByID(ctx context.Context, id string) (*Organization, error)
	FindBySlug(ctx context.Context, slug string) (*Organization, error)
	Update(ctx context.Context, id string, organization *Organization) error
	Delete(ctx context.Context, id string) error
	FindAll(ctx context.Context) ([]*Organization, error)
	FindAllCount(ctx context.Context) (int64, error)

	AddMember(ctx context.Context, orgUser *OrganizationUser) error
	RemoveMember(ctx context.Context, orgID, userID string) error
	UpdateMemberRole(ctx context.Context, orgID, userID string, role Role) error
	FindMembers(ctx context.Context, orgID string) ([]*OrganizationUser, error)
	FindUserOrganizations(ctx context.Context, userID string) ([]*OrganizationUser, error)
	FindMembership(ctx context.Context, orgID, userID string) (*OrganizationUser, error)

	CreateInvitation(ctx context.Context, invitation *Invitation) error
	FindInvitations(ctx context.Context, orgID string) ([]*Invitation, error)
	FindInvitationByToken(ctx context.Context, token string) (*Invitation, error)
	FindInvitationsByEmail(ctx context.Context, email string) ([]*Invitation, error)
	UpdateInvitationStatus(ctx context.Context, id string, status InvitationStatus) error
}
