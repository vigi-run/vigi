-- Seed Users
INSERT INTO users (
        id,
        email,
        name,
        password,
        active,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440000',
    'seed@example.com',
    'Seed User',
    '$2a$10$3XjX/X...dummyhash',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'seed@example.com'
    );
-- Seed Organization
INSERT INTO organizations (id, name, slug, created_at, updated_at)
SELECT '550e8400-e29b-41d4-a716-446655440001',
    'Seed Organization',
    'seed-org',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM organizations
        WHERE slug = 'seed-org'
    );
-- Seed Organization User
INSERT INTO organization_users (
        organization_id,
        user_id,
        role,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM organization_users
        WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001'
            AND user_id = '550e8400-e29b-41d4-a716-446655440000'
    );
-- Seed Clients
INSERT INTO clients (
        id,
        organization_id,
        name,
        classification,
        id_number,
        city,
        state,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Tech Corp',
    'company',
    '12345678000195',
    'São Paulo',
    'SP',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM clients
        WHERE id = '550e8400-e29b-41d4-a716-446655440002'
    );
INSERT INTO clients (
        id,
        organization_id,
        name,
        classification,
        id_number,
        city,
        state,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'John Doe Freelancer',
    'individual',
    '12345678909',
    'Rio de Janeiro',
    'RJ',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM clients
        WHERE id = '550e8400-e29b-41d4-a716-446655440003'
    );
INSERT INTO clients (
        id,
        organization_id,
        name,
        classification,
        id_number,
        city,
        state,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Jane Smith Consulting',
    'individual',
    '98765432100',
    'Curitiba',
    'PR',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM clients
        WHERE id = '550e8400-e29b-41d4-a716-446655440004'
    );
INSERT INTO clients (
        id,
        organization_id,
        name,
        classification,
        id_number,
        city,
        state,
        created_at,
        updated_at
    )
SELECT '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    'Mega Retail Ltda',
    'company',
    '98765432000198',
    'Belo Horizonte',
    'MG',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
        SELECT 1
        FROM clients
        WHERE id = '550e8400-e29b-41d4-a716-446655440005'
    );