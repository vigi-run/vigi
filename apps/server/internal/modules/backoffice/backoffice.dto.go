package backoffice

type StatsDto struct {
	TotalUsers    int64   `json:"totalUsers"`
	TotalOrgs     int64   `json:"totalOrgs"`
	ActivePings   float64 `json:"activePings"`
	ExecutedPings int64   `json:"executedPings"` // Total pings in last 24h
}

type UserListDto struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	OrgCount  int64  `json:"orgCount"`
	CreatedAt string `json:"createdAt"`
}

type OrgListDto struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	UserCount int64  `json:"userCount"`
	CreatedAt string `json:"createdAt"`
}

type OrgDetailDto struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Slug      string   `json:"slug"`
	UserCount int64    `json:"userCount"`
	CreatedAt string   `json:"createdAt"`
	Stats     OrgStats `json:"stats"`
}

type OrgStats struct {
	Monitors             int64 `json:"monitors"`
	StatusPages          int64 `json:"statusPages"`
	Maintenances         int64 `json:"maintenances"`
	NotificationChannels int64 `json:"notificationChannels"`
}
