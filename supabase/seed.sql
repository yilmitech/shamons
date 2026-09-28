-- =============================================================================
-- SHAMONS Poultry & Feeds — starting catalog data
-- Run this AFTER schema.sql. Safe to re-run (upserts on id).
--
-- Note on images: product photos live in public/product-images/ (stable,
-- served as-is by Vite — filenames match each product's id) and are wired up
-- below via image_url. To use different photos, drop new files into
-- public/product-images/ (or a Supabase Storage bucket) and update the
-- image_url values, either here or per-product in the Admin Portal.
-- =============================================================================

insert into public.products
  (id, name, category, sub_category, brand, breed, description, base_price, unit,
   min_order_quantity, image_url, is_feed, feed_sizes, chick_pricing, in_stock, stock_count,
   features, nutritional_info)
values
  ('doc-broiler-cobb500', 'Day-Old Chicks (DOC) - Broiler', 'birds', 'doc', 'Certified DOC', null,
   'Commercial broiler chicks. Excellent feed conversion with low mortality rate when properly brooded.',
   38500, 'Carton (50 Chicks + 1 Bonus)', 1, '/product-images/doc-broiler-cobb500.jpg', false, null,
   '{"pricePerChick":770,"pricePerCarton":38500,"chicksPerCarton":50}', true, 85,
   array['Vaccinated against Marek & Newcastle Disease at Hatchery','High livability rate (>98%) with proper temperature care','Order single chicks or full cartons with bonus'],
   '{"targetAge":"Day 0 to Week 7","usage":"Commercial meat production & quick turnaround"}'),

  ('doc-noiler', 'Day-Old Noilers (DOC)', 'birds', 'doc', 'Certified DOC', null,
   'Dual-purpose day-old chicks suitable for rural free-range and semi-intensive systems for delicious meat and eggs.',
   37500, 'Carton (50 Chicks + 1 Bonus)', 1, '/product-images/doc-noiler.jpg', false, null,
   '{"pricePerChick":750,"pricePerCarton":37500,"chicksPerCarton":50}', true, 60,
   array['Dual-purpose chicks for both meat and egg production','Thrives in local Northern climate conditions','Very active and quick to feed','Supplied in heat-insulated transport cartons','Order single chicks or full cartons'],
   null),

  ('doc-layer-isabrown', 'Day-Old Pullets (DOC Layers)', 'birds', 'doc', 'Certified DOC', null,
   'High-yield commercial brown egg layers with consistent laying performance and strong eggshell quality.',
   42000, 'Carton (50 Pullets + 1 Bonus)', 1, '/product-images/doc-layer-isabrown.jpg', false, null,
   '{"pricePerChick":840,"pricePerCarton":42000,"chicksPerCarton":50}', true, 45,
   array['100% feather-sexed females (pullets)','Very calm temperament, low feed consumption per egg','Hatchery vaccinated for Gumboro & Marek'],
   null),

  ('birds-table-broiler', 'Table Broilers (Mature Live Meat Birds)', 'birds', 'broiler', 'Live Birds', null,
   'Fully grown, healthy live broilers weighing between 2.6kg and 3.4kg. Fed purely on premium finisher for sweet, tender meat.',
   6000, 'Bird (Live Weight ~2.8kg - 3.2kg)', 1, '/product-images/birds-table-broiler.jpg', false, null, null, true, 150,
   array['Healthy farm-raised meat birds in Kaltungo','Ideal for home consumption, restaurants, parties & festive events','Free live bird crating for transport','Custom dressing service available upon request at depot'],
   null),

  ('birds-cockerel-improved', 'Noiler / Local Improved Cockerels (12 Weeks)', 'birds', 'cockerel', 'Live Birds', null,
   'Dual-purpose birds suitable for backyard and free-range poultry farming.',
   3800, 'Bird (12–14 Weeks Mature)', 1, '/product-images/birds-cockerel-improved.jpg', false, null, null, true, 90,
   array['High tolerance to hot climate and local diseases','Delicious native chicken flavor profile','Gains weight steadily on simple grains and poultry mash'],
   null),

  ('feed-chikun-super-starter', 'Chikun Super Starter', 'feeds', 'chikun', 'Chikun', null,
   'Formulated specifically for day-old chicks in their critical first 14 days. Enriched with gut stabilizers and organic immuno-nutrients for high early livability and rapid skeleton setup.',
   23800, 'Bag', 1, '/product-images/feed-chikun-super-starter.jpg', true,
   '{"fullBag":{"size":"25kg","price":23800,"inStock":true,"stockCount":120},"halfBag":{"size":"12.5kg","price":12300,"inStock":true,"stockCount":60}}',
   null, true, 120,
   array['Micro-pelletized crumbs for easy ingestion by day-old chicks','Fortified with gut flora conditioners and amino acids','Rapid bone formation and active early weight gain','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"0 to 2 Weeks (Day-Old Chicks)","usage":"Super starter for early chick survival"}'),

  ('feed-chikun-starter', 'Chikun Starter Pellets', 'feeds', 'chikun', 'Chikun', null,
   'Formulated specifically for brooding chicks up to 4 weeks. High digestible nutrient density and balanced amino acids ensure strong skeletal and organ growth.',
   22800, 'Bag', 1, '/product-images/feed-chikun-starter.jpg', true,
   '{"fullBag":{"size":"25kg","price":22800,"inStock":true,"stockCount":140},"halfBag":{"size":"12.5kg","price":11800,"inStock":true,"stockCount":80}}',
   null, true, 140,
   array['Micro-pelletized for easy ingestion and minimal wastage','Fortified with essential vitamins, organic selenium & coccidiostats','Guarantees rapid feathering and uniform chick weight','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"0 to 4 Weeks (Broilers & Cockerels)","usage":"Feed ad libitum with clean fresh water"}'),

  ('feed-chikun-finisher', 'Chikun Finisher Pellets (Rapid Weight Gain)', 'feeds', 'chikun', 'Chikun', null,
   'Finisher pellets designed for broilers from 4 weeks to market weight. Maximizes breast meat conversion and speeds up market readiness.',
   21800, 'Bag', 1, '/product-images/feed-chikun-finisher.jpg', true,
   '{"fullBag":{"size":"25kg","price":21800,"inStock":true,"stockCount":190},"halfBag":{"size":"12.5kg","price":11200,"inStock":true,"stockCount":65}}',
   null, true, 190,
   array['High metabolizable energy for rapid muscle buildup','Reduces total feed intake days to reach target weight','Firm pellet structure prevents dust and feed trough spillage','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"Week 4 to Market Day","usage":"Promotes rapid flesh development"}'),

  ('feed-chikun-layer1-mash', 'Chikun Layer 1 Mash (High Egg Production)', 'feeds', 'chikun', 'Chikun', null,
   'Formulated for laying birds from first egg up to 45 weeks of age. Enriched to support egg laying and consistent egg quality.',
   20500, 'Bag', 1, '/product-images/feed-chikun-layer1-mash.jpg', true,
   '{"fullBag":{"size":"25kg","price":20500,"inStock":true,"stockCount":110},"halfBag":{"size":"12.5kg","price":10600,"inStock":true,"stockCount":45}}',
   null, true, 110,
   array['Enriched with methionine, lysine and yolk pigmentation boosters','Maintains consistent golden yolk color and firm egg white albumin','Minimizes cracked eggs and cage layer fatigue','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"Laying Hens","usage":"Feed daily per laying bird"}'),

  ('feed-ultima-super-starter', 'Ultima Super Starter', 'feeds', 'ultima', 'Ultima', null,
   'Ultima premier super starter formulation featuring steam-conditioned micro-crumbs, active probiotics, and immuno-nutrients for superior chick vitality right from hatch day.',
   24500, 'Bag', 1, '/product-images/feed-ultima-super-starter.jpg', true,
   '{"fullBag":{"size":"25kg","price":24500,"inStock":true,"stockCount":115},"halfBag":{"size":"12.5kg","price":12600,"inStock":true,"stockCount":55}}',
   null, true, 115,
   array['Steam-conditioned micro-crumbs for delicate chick beaks','Zero digestive stress with live gut probiotic cultures','Accelerates muscular, skeletal and organ development','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"Day-Old Chicks","usage":"Super starter for early chick vigor"}'),

  ('feed-ultima-starter', 'Ultima Starter Pellets', 'feeds', 'ultima', 'Ultima', null,
   'Ultima premium starter formulation featuring highly digestible steam-conditioned grains, probiotics, and immuno-nutrients for superior chick vitality.',
   23500, 'Bag', 1, '/product-images/feed-ultima-starter.jpg', true,
   '{"fullBag":{"size":"25kg","price":23500,"inStock":true,"stockCount":130},"halfBag":{"size":"12.5kg","price":12000,"inStock":true,"stockCount":50}}',
   null, true, 130,
   array['Steam-conditioned micro-pellet crumb for zero crop impaction','Enriched with prebiotic gut stabilizers for extreme chick survival','Accelerates organ and skeletal density in early weeks','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"0 to 4 Weeks","usage":"Starter feed for sustained growth"}'),

  ('feed-ultima-finisher', 'Ultima Finisher Pellets (High Density Finishing)', 'feeds', 'ultima', 'Ultima', null,
   'Top-tier broiler finisher with high energy concentration. Delivers prime carcass yield and rapid weight gains.',
   22500, 'Bag', 1, '/product-images/feed-ultima-finisher.jpg', true,
   '{"fullBag":{"size":"25kg","price":22500,"inStock":true,"stockCount":160},"halfBag":{"size":"12.5kg","price":11500,"inStock":true,"stockCount":70}}',
   null, true, 160,
   array['Optimum amino acid balance for heavy breast meat packing','High feed efficiency for cost-effective broiler finishing','Low moisture pellet formulation with long shelf life','Available in 25kg Full Bag & 12.5kg Half Bag'],
   '{"targetAge":"Finishing Stage to Market Day","usage":"Feed to finish broilers to target weight"}')

on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_price = excluded.base_price,
  feed_sizes = excluded.feed_sizes,
  chick_pricing = excluded.chick_pricing,
  in_stock = excluded.in_stock,
  stock_count = excluded.stock_count,
  features = excluded.features,
  nutritional_info = excluded.nutritional_info;

insert into public.hatchery_batches
  (id, breed, hatch_date, total_chicks, available_cartons, price_per_carton, status, notes)
values
  ('batch-cobb-2026-08-28', 'DOC Broiler', '2026-08-28 (Thursday)', 5000, 42, 38500, 'booking_open',
   'Depot opens 6:45 AM for carton allocations.'),
  ('batch-noiler-2026-09-01', 'DOC Noilers', '2026-09-01 (Monday)', 4000, 35, 37500, 'booking_open',
   'Hardy dual-purpose chicks, early morning depot allocation.'),
  ('batch-isa-2026-09-04', 'DOC Layers', '2026-09-04 (Thursday)', 3000, 28, 42000, 'limited_slots',
   'High demand batch, reserve early.')
on conflict (id) do update set
  available_cartons = excluded.available_cartons,
  status = excluded.status,
  notes = excluded.notes;
