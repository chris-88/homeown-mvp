-- clients.notes was a single editable field. Notes are now append-only
-- staff_note events on the events table, so the column is no longer needed.
alter table clients drop column if exists notes;
