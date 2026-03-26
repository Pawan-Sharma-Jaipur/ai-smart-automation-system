-- Run this if face_descriptor column is missing
USE ai_automation;

ALTER TABLE users ADD COLUMN IF NOT EXISTS face_descriptor TEXT DEFAULT NULL;

SELECT 'face_descriptor column ready!' AS status;
