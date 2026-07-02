-- Update all users to have ROLE_USER
-- This ensures all users can access journal endpoints that require hasRole('USER') or hasRole('ADMIN')

-- First, ensure ROLE_USER exists
INSERT IGNORE INTO roles (name) VALUES ('ROLE_USER');

-- Get the ROLE_USER ID
SET @role_user_id = (SELECT id FROM roles WHERE name = 'ROLE_USER');

-- Add ROLE_USER to all users who don't already have it
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, @role_user_id
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = @role_user_id
);

-- Show summary of what was updated
SELECT 
    'Users updated with ROLE_USER' as action,
    COUNT(*) as count
FROM users u
WHERE EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = @role_user_id
);

-- Show all users and their roles after update
SELECT 
    u.id,
    u.email,
    u.name,
    GROUP_CONCAT(r.name ORDER BY r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.name
ORDER BY u.id;

-- Verify specific users mentioned in logs
SELECT 
    'Verification for specific users' as section,
    u.id,
    u.email,
    r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email IN ('testuser@gmail.com', 'anas@example.com')
ORDER BY u.email, r.name;
