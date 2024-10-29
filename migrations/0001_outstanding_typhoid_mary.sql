CREATE TABLE `review_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`flashcard_id` text NOT NULL,
	`rating` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`elapsed_days` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`response_time` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcard`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE flashcard ADD `audio` text;--> statement-breakpoint
ALTER TABLE flashcard ADD `state` text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `stability` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `difficulty` real DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `elapsed_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `scheduled_days` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `reps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE flashcard ADD `lapses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE study_session ADD `correct_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE study_session ADD `incorrect_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE study_session ADD `average_time` integer DEFAULT 0 NOT NULL;