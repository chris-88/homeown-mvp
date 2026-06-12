-- DAC reference and pathway start date on clients
-- dac_reference: the Homeown DAC entity the client is assigned to (set by staff)
-- pathway_start_date: when the client moved into the property (in_home stage)
alter table clients
  add column if not exists dac_reference      text,
  add column if not exists pathway_start_date date;
