-- Add FCM token column to notification_settings table
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS fcm_token TEXT;