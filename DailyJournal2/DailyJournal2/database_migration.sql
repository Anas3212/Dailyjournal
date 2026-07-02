-- Add temporary ownership fields to teams table
ALTER TABLE teams 
ADD COLUMN previous_owner_id BIGINT,
ADD COLUMN ownership_transfer_date DATETIME,
ADD COLUMN is_temporary_ownership BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint for previous_owner_id
ALTER TABLE teams 
ADD CONSTRAINT fk_teams_previous_owner 
FOREIGN KEY (previous_owner_id) REFERENCES users(id);

-- V10: Create user_verifications table for certificates, authorizations, and rewards
CREATE TABLE user_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('CERTIFICATE', 'AUTHORIZATION', 'REWARD') NOT NULL,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    description TEXT,
    visibility ENUM('PUBLIC', 'FRIENDS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    file_data LONGBLOB,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_verifications_user_id (user_id),
    INDEX idx_user_verifications_user_type (user_id, type),
    INDEX idx_user_verifications_user_visibility (user_id, visibility)
);
