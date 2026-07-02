-- Fix notice_boards table schema - drop and recreate with correct structure
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notice_boards;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE notice_boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    team_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pinned BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_team_pinned_created (team_id, pinned, created_at DESC),
    INDEX idx_team_created (team_id, created_at DESC)
);
