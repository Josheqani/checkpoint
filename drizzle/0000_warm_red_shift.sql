CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cadence` text NOT NULL,
	`reminder_time` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`phone_number` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`sent_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reminders_goal_id_idx` ON `reminders` (`goal_id`);--> statement-breakpoint
CREATE INDEX `reminders_scheduled_at_idx` ON `reminders` (`scheduled_at`);--> statement-breakpoint
CREATE TABLE `sent_log` (
	`id` text PRIMARY KEY NOT NULL,
	`reminder_id` text NOT NULL,
	`phone_number` text NOT NULL,
	`status` text NOT NULL,
	`error_code` text,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`reminder_id`) REFERENCES `reminders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sent_log_reminder_id_idx` ON `sent_log` (`reminder_id`);