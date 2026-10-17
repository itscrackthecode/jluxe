BEGIN;

-- Some databases predate the current optionName field and still have a
-- required legacy name column. New configuration writes use optionName.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PropertyConfiguration'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE public."PropertyConfiguration"
      ALTER COLUMN "name" DROP NOT NULL;
  END IF;
END $$;

COMMIT;
