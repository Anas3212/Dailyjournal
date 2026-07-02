-- Drop existing reports table if it exists
DROP TABLE IF EXISTS reports;

-- Create new reports table for journal reporting functionality
CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    reported_journal_id BIGINT NOT NULL,
    reported_user_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by_id BIGINT NULL,
    admin_notes TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_journal FOREIGN KEY (reported_journal_id) REFERENCES journal_entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported_user FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_reports_status (status),
    INDEX idx_reports_created_at (created_at),
    INDEX idx_reports_reporter (reporter_id),
    INDEX idx_reports_journal (reported_journal_id),
    INDEX idx_reports_reported_user (reported_user_id),
    
    -- Unique constraint to prevent duplicate reports from same user for same journal
    UNIQUE KEY unique_user_journal_report (reporter_id, reported_journal_id)
);

-- Add check constraints for enum values
ALTER TABLE reports 
ADD CONSTRAINT chk_report_reason 
CHECK (reason IN ('INAPPROPRIATE_CONTENT', 'SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'PRIVACY_VIOLATION', 'COPYRIGHT_INFRINGEMENT', 'MISINFORMATION', 'OTHER'));

ALTER TABLE reports 
ADD CONSTRAINT chk_report_status 
CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'));
