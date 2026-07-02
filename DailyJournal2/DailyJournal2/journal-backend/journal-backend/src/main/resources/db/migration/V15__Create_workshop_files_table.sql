-- Create workshop_files table for storing user-created files
CREATE TABLE workshop_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type ENUM('TEXT', 'DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'MARKDOWN', 'CODE', 'JSON', 'CSV') NOT NULL,
    content LONGTEXT,
    description TEXT,
    category VARCHAR(100),
    tags VARCHAR(500),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    file_size BIGINT DEFAULT 0,
    is_shared BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255),
    
    -- Foreign key constraints
    CONSTRAINT fk_workshop_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_workshop_files_user_id (user_id),
    INDEX idx_workshop_files_file_type (file_type),
    INDEX idx_workshop_files_category (category),
    INDEX idx_workshop_files_created_at (created_at),
    INDEX idx_workshop_files_share_token (share_token),
    
    -- Unique constraint for share tokens
    UNIQUE KEY uk_workshop_files_share_token (share_token)
);

-- Insert sample workshop files for demonstration
INSERT INTO workshop_files (file_name, file_type, content, description, category, user_id, file_size) VALUES
('Welcome Document', 'DOCUMENT', '# Welcome to Workshop\n\nThis is your first document in the workshop. You can create various types of files here:\n\n- Text documents\n- Spreadsheets\n- Presentations\n- Code files\n- And more!\n\n**Getting Started:**\n1. Click "New File" to create a new document\n2. Choose your file type\n3. Start editing with our built-in editors\n4. Save and organize your files\n\nEnjoy creating!', 'A welcome document to get you started with the workshop', 'Getting Started', 1, 450),
('Sample Spreadsheet', 'SPREADSHEET', '{"sheets":[{"name":"Sheet1","data":[["Name","Age","City","Occupation"],["John Doe","30","New York","Developer"],["Jane Smith","25","Los Angeles","Designer"],["Bob Johnson","35","Chicago","Manager"],["Alice Brown","28","Houston","Analyst"]]}]}', 'Sample spreadsheet with employee data', 'Data', 1, 280),
('Project Notes', 'TEXT', 'Project Planning Notes\n\n======================\n\nPhase 1: Research\n- Market analysis\n- Competitor research\n- User interviews\n\nPhase 2: Design\n- Wireframes\n- Mockups\n- Prototypes\n\nPhase 3: Development\n- Backend API\n- Frontend UI\n- Testing\n\nPhase 4: Launch\n- Deployment\n- Marketing\n- User feedback\n\nDeadlines:\n- Phase 1: End of month\n- Phase 2: Mid next month\n- Phase 3: End of next month\n- Phase 4: Following month', 'Planning notes for upcoming project', 'Projects', 1, 520);
