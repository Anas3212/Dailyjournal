-- Drop existing user_sessions table if it exists
DROP TABLE IF EXISTS user_sessions;

-- Create new user_sessions table with clean structure
CREATE TABLE user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    jwt_token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    device_type VARCHAR(50),
    location VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP NULL,
    revoked_reason VARCHAR(100),
    
    -- Foreign key constraint
    CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_jwt_token_hash (jwt_token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_user_active (user_id, is_active)
);

-- Add comment to table
ALTER TABLE user_sessions COMMENT = 'User session tracking for enhanced security and session management';
