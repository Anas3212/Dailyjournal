-- Team Connections Migration Script
-- Creates the team_connections table for enabling teams to connect and collaborate

-- Create team_connections table
CREATE TABLE IF NOT EXISTS team_connections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_team_id BIGINT NOT NULL,
    target_team_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_team_connections_requester_team 
        FOREIGN KEY (requester_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_connections_target_team 
        FOREIGN KEY (target_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_connections_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate connection requests
    CONSTRAINT uk_team_connections_teams 
        UNIQUE (requester_team_id, target_team_id),
    
    -- Check constraint to prevent self-connections
    CONSTRAINT chk_team_connections_different_teams 
        CHECK (requester_team_id != target_team_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_team_connections_requester_team ON team_connections(requester_team_id);
CREATE INDEX idx_team_connections_target_team ON team_connections(target_team_id);
CREATE INDEX idx_team_connections_status ON team_connections(status);
CREATE INDEX idx_team_connections_created_at ON team_connections(created_at);
CREATE INDEX idx_team_connections_updated_at ON team_connections(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_team_connections_requester_status ON team_connections(requester_team_id, status);
CREATE INDEX idx_team_connections_target_status ON team_connections(target_team_id, status);

-- Insert sample data for testing (optional - remove in production)
-- Uncomment the following lines if you want to add sample connections for testing

/*
-- Sample team connections (assuming teams with IDs 1, 2, 3 exist)
INSERT INTO team_connections (requester_team_id, target_team_id, created_by, status, message) VALUES
(1, 2, 1, 'PENDING', 'Would like to collaborate on shared projects'),
(2, 3, 2, 'ACCEPTED', 'Looking forward to working together'),
(1, 3, 1, 'REJECTED', 'Thanks for considering our request');
*/

-- Verify the table was created successfully
SELECT 'Team connections table created successfully' AS status;
