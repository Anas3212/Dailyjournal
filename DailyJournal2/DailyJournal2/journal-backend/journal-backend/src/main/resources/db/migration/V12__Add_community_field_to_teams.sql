-- Migration to add community field to teams table
-- This field is optional and allows team masters to specify their team's community (area name, institution, workspace, etc.)

ALTER TABLE teams ADD COLUMN community VARCHAR(255);

-- Add comment to document the purpose of the field
COMMENT ON COLUMN teams.community IS 'Optional community field for area name, institution, workspace, or other place association that the team belongs to';
