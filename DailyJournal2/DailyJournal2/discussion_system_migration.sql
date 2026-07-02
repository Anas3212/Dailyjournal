-- Discussion System Migration
-- Creates tables for discussions, answers, and votes on published journals

-- Create discussions table
CREATE TABLE discussions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    journal_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'CLOSED', 'ARCHIVED', 'DELETED') DEFAULT 'ACTIVE',
    view_count BIGINT DEFAULT 0,
    answer_count BIGINT DEFAULT 0,
    vote_score BIGINT DEFAULT 0,
    
    FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_discussions_journal_id (journal_id),
    INDEX idx_discussions_author_id (author_id),
    INDEX idx_discussions_status (status),
    INDEX idx_discussions_created_at (created_at),
    INDEX idx_discussions_vote_score (vote_score),
    INDEX idx_discussions_pinned_created (is_pinned, created_at),
    
    UNIQUE KEY unique_user_journal_discussion (journal_id, author_id)
);

-- Create discussion_answers table
CREATE TABLE discussion_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    discussion_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_answer_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    vote_score BIGINT DEFAULT 0,
    reply_count BIGINT DEFAULT 0,
    
    FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_answer_id) REFERENCES discussion_answers(id) ON DELETE CASCADE,
    
    INDEX idx_answers_discussion_id (discussion_id),
    INDEX idx_answers_author_id (author_id),
    INDEX idx_answers_parent_id (parent_answer_id),
    INDEX idx_answers_created_at (created_at),
    INDEX idx_answers_vote_score (vote_score),
    INDEX idx_answers_accepted (is_accepted),
    INDEX idx_answers_not_deleted (is_deleted)
);

-- Create discussion_votes table
CREATE TABLE discussion_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    discussion_id BIGINT NULL,
    answer_id BIGINT NULL,
    vote_type ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES discussion_answers(id) ON DELETE CASCADE,
    
    INDEX idx_votes_user_id (user_id),
    INDEX idx_votes_discussion_id (discussion_id),
    INDEX idx_votes_answer_id (answer_id),
    INDEX idx_votes_type (vote_type),
    
    UNIQUE KEY unique_user_discussion_vote (user_id, discussion_id),
    UNIQUE KEY unique_user_answer_vote (user_id, answer_id),
    
    CONSTRAINT check_vote_target CHECK (
        (discussion_id IS NOT NULL AND answer_id IS NULL) OR 
        (discussion_id IS NULL AND answer_id IS NOT NULL)
    )
);

-- Add triggers to maintain counts

-- Trigger to update discussion answer count when answer is added
DELIMITER $$
CREATE TRIGGER update_discussion_answer_count_insert
AFTER INSERT ON discussion_answers
FOR EACH ROW
BEGIN
    IF NEW.is_deleted = FALSE THEN
        UPDATE discussions 
        SET answer_count = answer_count + 1 
        WHERE id = NEW.discussion_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update discussion answer count when answer is deleted/undeleted
DELIMITER $$
CREATE TRIGGER update_discussion_answer_count_update
AFTER UPDATE ON discussion_answers
FOR EACH ROW
BEGIN
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        UPDATE discussions 
        SET answer_count = answer_count - 1 
        WHERE id = NEW.discussion_id;
    ELSEIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
        UPDATE discussions 
        SET answer_count = answer_count + 1 
        WHERE id = NEW.discussion_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update answer reply count when reply is added
DELIMITER $$
CREATE TRIGGER update_answer_reply_count_insert
AFTER INSERT ON discussion_answers
FOR EACH ROW
BEGIN
    IF NEW.parent_answer_id IS NOT NULL AND NEW.is_deleted = FALSE THEN
        UPDATE discussion_answers 
        SET reply_count = reply_count + 1 
        WHERE id = NEW.parent_answer_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update answer reply count when reply is deleted/undeleted
DELIMITER $$
CREATE TRIGGER update_answer_reply_count_update
AFTER UPDATE ON discussion_answers
FOR EACH ROW
BEGIN
    IF NEW.parent_answer_id IS NOT NULL THEN
        IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
            UPDATE discussion_answers 
            SET reply_count = reply_count - 1 
            WHERE id = NEW.parent_answer_id;
        ELSEIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
            UPDATE discussion_answers 
            SET reply_count = reply_count + 1 
            WHERE id = NEW.parent_answer_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- Trigger to update discussion vote score
DELIMITER $$
CREATE TRIGGER update_discussion_vote_score
AFTER INSERT ON discussion_votes
FOR EACH ROW
BEGIN
    IF NEW.discussion_id IS NOT NULL THEN
        UPDATE discussions 
        SET vote_score = (
            SELECT COALESCE(SUM(CASE WHEN vote_type = 'UPVOTE' THEN 1 ELSE -1 END), 0)
            FROM discussion_votes 
            WHERE discussion_id = NEW.discussion_id
        )
        WHERE id = NEW.discussion_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update discussion vote score on delete
DELIMITER $$
CREATE TRIGGER update_discussion_vote_score_delete
AFTER DELETE ON discussion_votes
FOR EACH ROW
BEGIN
    IF OLD.discussion_id IS NOT NULL THEN
        UPDATE discussions 
        SET vote_score = (
            SELECT COALESCE(SUM(CASE WHEN vote_type = 'UPVOTE' THEN 1 ELSE -1 END), 0)
            FROM discussion_votes 
            WHERE discussion_id = OLD.discussion_id
        )
        WHERE id = OLD.discussion_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update answer vote score
DELIMITER $$
CREATE TRIGGER update_answer_vote_score
AFTER INSERT ON discussion_votes
FOR EACH ROW
BEGIN
    IF NEW.answer_id IS NOT NULL THEN
        UPDATE discussion_answers 
        SET vote_score = (
            SELECT COALESCE(SUM(CASE WHEN vote_type = 'UPVOTE' THEN 1 ELSE -1 END), 0)
            FROM discussion_votes 
            WHERE answer_id = NEW.answer_id
        )
        WHERE id = NEW.answer_id;
    END IF;
END$$
DELIMITER ;

-- Trigger to update answer vote score on delete
DELIMITER $$
CREATE TRIGGER update_answer_vote_score_delete
AFTER DELETE ON discussion_votes
FOR EACH ROW
BEGIN
    IF OLD.answer_id IS NOT NULL THEN
        UPDATE discussion_answers 
        SET vote_score = (
            SELECT COALESCE(SUM(CASE WHEN vote_type = 'UPVOTE' THEN 1 ELSE -1 END), 0)
            FROM discussion_votes 
            WHERE answer_id = OLD.answer_id
        )
        WHERE id = OLD.answer_id;
    END IF;
END$$
DELIMITER ;

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want to add sample discussions

/*
-- Sample discussion (replace journal_id and author_id with actual values)
INSERT INTO discussions (title, content, journal_id, author_id) VALUES
('What are your thoughts on this journal entry?', 'I found this journal entry really interesting and would love to hear what others think about the experiences shared here.', 1, 1);

-- Sample answer
INSERT INTO discussion_answers (content, discussion_id, author_id) VALUES
('I completely agree with the sentiments expressed in this journal. It really resonates with my own experiences.', 1, 2);

-- Sample vote
INSERT INTO discussion_votes (user_id, discussion_id, vote_type) VALUES
(2, 1, 'UPVOTE');
*/
