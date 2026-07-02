-- Migration to add community field to users table
-- This field is optional and allows users to specify their community (area name, institution, workspace, etc.)

ALTER TABLE users ADD COLUMN community VARCHAR(255);

-- Add comment to document the purpose of the field
COMMENT ON COLUMN users.community IS 'Optional community field for area name, institution, workspace, or other place association';
