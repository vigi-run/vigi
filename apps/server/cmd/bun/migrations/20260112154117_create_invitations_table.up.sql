CREATE TABLE invitations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);
CREATE INDEX idx_invitations_organization_id ON invitations (organization_id);
CREATE INDEX idx_invitations_token ON invitations (token);
CREATE INDEX idx_invitations_email ON invitations (email);