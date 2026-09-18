PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `reminders`;--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`phone_number` text NOT NULL,
	`schedule_type` text NOT NULL,
	`scheduled_at` integer,
	`recurrence_pattern` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `reminders_goal_id_idx` ON `reminders` (`goal_id`);--> statement-breakpoint
CREATE INDEX `reminders_scheduled_at_idx` ON `reminders` (`scheduled_at`);--> statement-breakpoint
ALTER TABLE `goals` ADD `target_date` integer;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `cadence`;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `reminder_time`;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `timezone`;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `phone_number`;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `status`;