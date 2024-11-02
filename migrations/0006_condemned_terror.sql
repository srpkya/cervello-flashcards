CREATE TABLE `user_rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`translation_count` integer DEFAULT 0 NOT NULL,
	`translation_reset_time` integer NOT NULL,
	`daily_count` integer DEFAULT 0 NOT NULL,
	`daily_reset_time` integer NOT NULL,
	`monthly_count` integer DEFAULT 0 NOT NULL,
	`monthly_reset_time` integer NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
