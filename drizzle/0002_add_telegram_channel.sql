ALTER TABLE `reminders` ADD COLUMN `channel` text DEFAULT 'sms' NOT NULL;--> statement-breakpoint
ALTER TABLE `reminders` ADD COLUMN `telegram_chat_id` text;--> statement-breakpoint
ALTER TABLE `sent_log` ADD COLUMN `channel` text DEFAULT 'sms' NOT NULL;
