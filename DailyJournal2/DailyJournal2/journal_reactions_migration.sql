-- Migration for Journal Reactions and Views System
-- This creates the necessary tables for journal reactions (likes, dislikes, hearts) and view tracking

-- Create journal_reactions table
CREATE TABLE IF NOT EXISTS journal_reactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('LIKE', 'DISLIKE', 'HEART')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_journal_reactions_journal FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate reactions from same user
    CONSTRAINT uk_journal_reactions_user_journal UNIQUE (journal_id, user_id)
);

-- Create journal_views table for tracking views
CREATE TABLE IF NOT EXISTS journal_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    user_id BIGINT NULL, -- NULL for anonymous views
    ip_address VARCHAR(45), -- For tracking anonymous views
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_journal_views_journal FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_journal_reactions_journal_id ON journal_reactions(journal_id);
CREATE INDEX idx_journal_reactions_user_id ON journal_reactions(user_id);
CREATE INDEX idx_journal_reactions_type ON journal_reactions(type);
CREATE INDEX idx_journal_reactions_created_at ON journal_reactions(created_at);

CREATE INDEX idx_journal_views_journal_id ON journal_views(journal_id);
CREATE INDEX idx_journal_views_user_id ON journal_views(user_id);
CREATE INDEX idx_journal_views_viewed_at ON journal_views(viewed_at);
CREATE INDEX idx_journal_views_ip_address ON journal_views(ip_address);

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data
/*
INSERT INTO journal_reactions (journal_id, user_id, type, created_at, updated_at) VALUES
(1, 1, 'LIKE', NOW(), NOW()),
(1, 2, 'HEART', NOW(), NOW()),
(2, 1, 'DISLIKE', NOW(), NOW()),
(2, 3, 'LIKE', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO journal_views (journal_id, user_id, viewed_at) VALUES
(1, 1, NOW()),
(1, 2, NOW()),
(1, 3, NOW()),
(2, 1, NOW()),
(2, 2, NOW())
ON DUPLICATE KEY UPDATE viewed_at = NOW();
*/
