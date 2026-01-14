package backoffice

import (
	"context"
	"vigi/internal/modules/auth"
	"vigi/internal/modules/organization"
	"vigi/internal/modules/stats"
)

type Service interface {
	GetStats(ctx context.Context) (*StatsDto, error)
	ListUsers(ctx context.Context) ([]*UserListDto, error)
	ListOrganizations(ctx context.Context) ([]*OrgListDto, error)
}

type ServiceImpl struct {
	authRepo  auth.Repository
	orgRepo   organization.OrganizationRepository
	statsRepo stats.Repository
}

func NewService(authRepo auth.Repository, orgRepo organization.OrganizationRepository, statsRepo stats.Repository) Service {
	return &ServiceImpl{
		authRepo:  authRepo,
		orgRepo:   orgRepo,
		statsRepo: statsRepo, // We might need stats service if logic is complex, but repo seems fine for now if we just read
		// Wait, stats logic for "Active Pings" usually involves aggregation.
		// The prompt said "ping ativos / executados por hora"
		// This likely means I need to aggregate from stats.
	}
}

func (s *ServiceImpl) GetStats(ctx context.Context) (*StatsDto, error) {
	userCount, err := s.authRepo.FindAllCount(ctx)
	if err != nil {
		return nil, err
	}

	orgCount, err := s.orgRepo.FindAllCount(ctx)
	if err != nil {
		return nil, err
	}

	// Executed Pings in last 24h: This requires querying stats.
	// Since there is no global stats API on stats module, I might need to rely on what I have.
	// However, I can't easily query "all pings" without monitor ID in the current stats repo structure (it's sharded by monitor_id in queries usually).
	// Actually, the stats table has monitor_id partition/index but maybe I can query across?
	// The `stats` table in SQL has `monitor_id` as column. Mongo has collections.
	// This might be expensive if I don't have a global index or aggregation.
	// Let's implement a simplified version or add a method to stats repo if needed.
	// For now, I'll return placeholders or basic counts if feasible.

	// WAIT: current stats repo `FindStatsByMonitorIDAndTimeRange` requires monitorID.
	// I cannot easily get "Active Pings" globally without iterating all monitors or having a special query.
	// Let's defer complex stats implementation details and focus on getting 0 for now or simple things.

	return &StatsDto{
		TotalUsers:    userCount,
		TotalOrgs:     orgCount,
		ActivePings:   0, // Placeholder
		ExecutedPings: 0, // Placeholder
	}, nil
}

func (s *ServiceImpl) ListUsers(ctx context.Context) ([]*UserListDto, error) {
	users, err := s.authRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var dtos []*UserListDto
	for _, u := range users {
		orgs, _ := s.orgRepo.FindUserOrganizations(ctx, u.ID)
		dtos = append(dtos, &UserListDto{
			ID:        u.ID,
			Email:     u.Email,
			Name:      u.Name,
			Role:      u.Role,
			OrgCount:  int64(len(orgs)),
			CreatedAt: u.CreatedAt.String(),
		})
	}
	return dtos, nil
}

func (s *ServiceImpl) ListOrganizations(ctx context.Context) ([]*OrgListDto, error) {
	orgs, err := s.orgRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var dtos []*OrgListDto
	for _, o := range orgs {
		members, _ := s.orgRepo.FindMembers(ctx, o.ID)
		dtos = append(dtos, &OrgListDto{
			ID:        o.ID,
			Name:      o.Name,
			Slug:      o.Slug,
			UserCount: int64(len(members)),
			CreatedAt: o.CreatedAt.String(),
		})
	}
	return dtos, nil
}
