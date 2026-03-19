ALTER TABLE licenses ADD COLUMN IF NOT EXISTS vendor text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_type text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false;
