-- Step 1: Add nullable column (không lock)
ALTER TABLE "Todo" ADD COLUMN "priority" INTEGER;

-- Step 2: Backfill data (từng batch)
UPDATE "Todo" SET "priority" = 0 WHERE "priority" IS NULL;

-- Step 3: Add NOT NULL + default (fast)
ALTER TABLE "Todo" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "Todo" ALTER COLUMN "priority" SET DEFAULT 0;

-- Step 4: Add index CONCURRENTLY (không lock)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todo_priority ON "Todo" ("priority");
