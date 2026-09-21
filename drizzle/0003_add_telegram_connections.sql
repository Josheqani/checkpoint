CREATE TABLE IF NOT EXISTS `telegram_connections` (
	`token` text PRIMARY KEY NOT NULL,
	`chat_id` text,
	`username` text,
	`first_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `telegram_connections_status_idx` ON `telegram_connections` (`status`);
