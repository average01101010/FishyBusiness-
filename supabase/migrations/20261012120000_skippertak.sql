-- Skippertak (12.10.2026; Jonas: «Tenker vi lanserer Energidrikken "Skippertak" med en light, en vanlig og en max variant til
-- henholdsvis 29, 39 og 49 kr», «Hele flåten», «Det skal ikke kunne kjøpes noe skippertak med vanlig spillvaluta»). An energy drink
-- for real money only: you and the crews of the whole fleet stay rested for one, two or four game days (core/15-energy.js giveSkip).
-- The game's prices (SKIP) and these must agree, as for haill and trim.
insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('skip_light', 'booster', 'Skippertak Light (uthvilt i 1 spilldøgn, hele flåten)', 'Skippertak Light (rested for 1 game day, the whole fleet)', 29, '{"give":"skip","k":"light"}'),
  ('skip', 'booster', 'Skippertak (uthvilt i 2 spilldøgn, hele flåten)', 'Skippertak (rested for 2 game days, the whole fleet)', 39, '{"give":"skip","k":"std"}'),
  ('skip_max', 'booster', 'Skippertak Max (uthvilt i 4 spilldøgn, hele flåten)', 'Skippertak Max (rested for 4 game days, the whole fleet)', 49, '{"give":"skip","k":"max"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;
