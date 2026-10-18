ALTER TABLE `workspace_users` ADD `owner_slot` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_users_owner_slot_unique` ON `workspace_users` (`owner_slot`);