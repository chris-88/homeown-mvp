-- Extend calculator_snapshots with wizard fields
alter table calculator_snapshots
  add column if not exists county          text,
  add column if not exists dublin_postcode text,  -- null unless county = 'Dublin'
  add column if not exists household_type  text check (household_type in ('solo', 'couple')),
  add column if not exists is_ftb          boolean,
  add column if not exists ghi             integer,   -- annual gross household income in euros
  add column if not exists employment_type text check (employment_type in ('paye', 'self_employed', 'mixed')),
  add column if not exists eligible        boolean;  -- result of the GHI × 4 >= strike_price check
