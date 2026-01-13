-- Add name and image_url to users table
ALTER TABLE users
ADD COLUMN name VARCHAR(255);
ALTER TABLE users
ADD COLUMN image_url TEXT;
-- Add image_url to organizations table
ALTER TABLE organizations
ADD COLUMN image_url TEXT;