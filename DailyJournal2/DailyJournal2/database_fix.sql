-- Fix role column size to accommodate MASTER, ADMIN, MEMBER values
-- Run this SQL script in your MySQL database

USE journal_db;

-- Alter the role column to allow longer strings
ALTER TABLE team_members MODIFY COLUMN role VARCHAR(10) NOT NULL;

-- Verify the change
DESCRIBE team_members;

-- Optional: Check existing data
SELECT id, role, user_id, team_id FROM team_members;
