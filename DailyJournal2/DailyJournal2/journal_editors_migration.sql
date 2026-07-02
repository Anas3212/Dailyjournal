-- Migration script for journal_editors table
-- This allows team masters to assign specific admins to edit particular journals

CREATE TABLE journal_editors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    assigned_by_user_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Foreign key constraints
    CONSTRAINT fk_journal_editors_journal 
        FOREIGN KEY (journal_id) REFERENCES journal_entry(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_journal_editors_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_journal_editors_assigned_by 
        FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate assignments
    CONSTRAINT uk_journal_editors_journal_user 
        UNIQUE (journal_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_journal_editors_journal_id ON journal_editors(journal_id);
CREATE INDEX idx_journal_editors_user_id ON journal_editors(user_id);
CREATE INDEX idx_journal_editors_assigned_by ON journal_editors(assigned_by_user_id);
CREATE INDEX idx_journal_editors_active ON journal_editors(is_active);
CREATE INDEX idx_journal_editors_assigned_at ON journal_editors(assigned_at);

-- Composite indexes for common queries
CREATE INDEX idx_journal_editors_journal_active ON journal_editors(journal_id, is_active);
CREATE INDEX idx_journal_editors_user_active ON journal_editors(user_id, is_active);

-- Sample data for testing (optional - remove in production)
-- INSERT INTO journal_editors (journal_id, user_id, assigned_by_user_id, is_active) 
-- VALUES 
-- (1, 2, 1, TRUE),  -- Admin user 2 can edit journal 1, assigned by user 1
-- (2, 3, 1, TRUE);  -- Admin user 3 can edit journal 2, assigned by user 1
