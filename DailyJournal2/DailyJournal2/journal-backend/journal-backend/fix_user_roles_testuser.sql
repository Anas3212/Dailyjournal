-- Fix user roles for testuser@gmail.com - Add ROLE_USER
-- This user is missing the ROLE_USER role which is required for journal access

-- First, ensure ROLE_USER exists
INSERT IGNORE INTO roles (name) VALUES ('ROLE_USER');

-- Get the role IDs
SET @role_user_id = (SELECT id FROM roles WHERE name = 'ROLE_USER');
SET @role_admin_id = (SELECT id FROM roles WHERE name = 'ROLE_ADMIN');

-- Add ROLE_USER to user testuser@gmail.com if not exists
INSERT IGNORE INTO user_roles (user_id, role_id) 
SELECT u.id, @role_user_id 
FROM users u 
WHERE u.email = 'testuser@gmail.com' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = @role_user_id
);

-- Check current roles for the user
SELECT u.id, u.email, r.name as role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'testuser@gmail.com';

-- Verify the fix worked
SELECT 'Fix completed for testuser@gmail.com' as status;
