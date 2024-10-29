CREATE TABLE `deck_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`shared_deck_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shared_deck_id`) REFERENCES `shared_deck`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deck_rating` (
	`id` text PRIMARY KEY NOT NULL,
	`shared_deck_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shared_deck_id`) REFERENCES `shared_deck`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shared_deck` (
	`id` text PRIMARY KEY NOT NULL,
	`original_deck_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`original_deck_id`) REFERENCES `deck`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
