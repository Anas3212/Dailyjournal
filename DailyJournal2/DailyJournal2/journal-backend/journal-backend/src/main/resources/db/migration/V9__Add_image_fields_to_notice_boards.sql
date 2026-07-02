-- Add image fields to notice_boards table for blob storage
ALTER TABLE notice_boards 
ADD COLUMN image_data LONGBLOB,
ADD COLUMN image_name VARCHAR(255),
ADD COLUMN image_type VARCHAR(100);
