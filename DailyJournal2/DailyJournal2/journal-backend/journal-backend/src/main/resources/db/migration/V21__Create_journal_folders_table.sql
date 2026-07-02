-- Create journal folders table for organizing journals
CREATE TABLE journal_folders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(50) DEFAULT '#2196F3',
    icon VARCHAR(50) DEFAULT 'folder',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_journal_folders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate folder names per user
    CONSTRAINT uk_journal_folders_name_user UNIQUE (name, user_id)
);

-- Add folder_id column to journal_entry table
ALTER TABLE journal_entry 
ADD COLUMN folder_id BIGINT,
ADD CONSTRAINT fk_journal_entry_folder FOREIGN KEY (folder_id) REFERENCES journal_folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_journal_folders_user_id ON journal_folders(user_id);
CREATE INDEX idx_journal_folders_created_at ON journal_folders(created_at);
CREATE INDEX idx_journal_folders_name ON journal_folders(name);
CREATE INDEX idx_journal_entry_folder_id ON journal_entry(folder_id);

-- Insert some sample folders for existing users (optional)
-- This will create default folders for users who already have journals
INSERT INTO journal_folders (name, description, color, icon, user_id, created_at, updated_at)
SELECT 
    'Personal' as name,
    'Personal thoughts and daily reflections' as description,
    '#4CAF50' as color,
    'person' as icon,
    u.id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM users u 
WHERE EXISTS (SELECT 1 FROM journal_entry je WHERE je.user_id = u.id AND je.team_id IS NULL)
AND NOT EXISTS (SELECT 1 FROM journal_folders jf WHERE jf.user_id = u.id AND jf.name = 'Personal');

INSERT INTO journal_folders (name, description, color, icon, user_id, created_at, updated_at)
SELECT 
    'Work' as name,
    'Work-related journals and professional thoughts' as description,
    '#FF9800' as color,
    'work' as icon,
    u.id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM users u 
WHERE EXISTS (SELECT 1 FROM journal_entry je WHERE je.user_id = u.id)
AND NOT EXISTS (SELECT 1 FROM journal_folders jf WHERE jf.user_id = u.id AND jf.name = 'Work');

INSERT INTO journal_folders (name, description, color, icon, user_id, created_at, updated_at)
SELECT 
    'Ideas' as name,
    'Creative ideas and inspiration' as description,
    '#9C27B0' as color,
    'lightbulb' as icon,
    u.id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM users u 
WHERE EXISTS (SELECT 1 FROM journal_entry je WHERE je.user_id = u.id)
AND NOT EXISTS (SELECT 1 FROM journal_folders jf WHERE jf.user_id = u.id AND jf.name = 'Ideas');
