-- Gary CT Black/Black stock number was typed as KS2121B; the correct code is KS0221B
-- (same pattern as KS0221, KS0223B, KS0224B). Run ONCE in the Supabase SQL editor, AFTER the
-- code change is deployed. Safe to re-run. Analytics already counts old + new together, so this
-- mainly keeps inventory (stock decrements) and reviews/overrides attached to the right product.

-- 1) Inventory (unique on stock_no+size): rename rows that don't collide with existing KS0221B rows.
update inventory i
   set stock_no = 'KS0221B'
 where upper(i.stock_no) = 'KS2121B'
   and not exists (select 1 from inventory j where j.stock_no = 'KS0221B' and j.size = i.size);

-- Any rows still under KS2121B collided with an existing KS0221B size — merge those by hand:
select * from inventory where upper(stock_no) = 'KS2121B';

-- 2) Retail sales log
update retail_sales set stock_no = 'KS0221B' where upper(stock_no) = 'KS2121B';

-- 3) Online orders: stock numbers live inside the items JSON
update orders
   set items = replace(items::text, 'KS2121B', 'KS0221B')::jsonb
 where items::text like '%KS2121B%';

-- 4) Reviews + admin product overrides (price/description edits) follow the product
update reviews set stock_no = 'KS0221B' where upper(stock_no) = 'KS2121B';
update product_overrides o
   set stock_no = 'KS0221B'
 where upper(o.stock_no) = 'KS2121B'
   and not exists (select 1 from product_overrides p where p.stock_no = 'KS0221B');
