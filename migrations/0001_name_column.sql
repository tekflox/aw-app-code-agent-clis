-- 0001 — persisted per-session custom name override.
--
-- ctx.db.create()'s CREATE TABLE IF NOT EXISTS never alters an existing
-- table, so adding this nullable column to an already-installed table
-- belongs here, not in sessions.py's _TABLE_DDL — see
-- src/apps/migrations.py in aw-workspace core.
--
-- Unqualified on purpose: aw-workspace's src/apps/migrations.py sets
-- search_path to this workspace's schema for the transaction.

ALTER TABLE "app__code-agent-clis__sessions"
    ADD COLUMN IF NOT EXISTS name TEXT;
