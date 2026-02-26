-- Clean up duplicate universal rating categories per user
-- Keep only the first set (lowest sort_order) for each user_id + name combo
DELETE FROM public.rating_categories
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at ASC) as rn
    FROM public.rating_categories
    WHERE passion_food_id IS NULL AND user_id IS NOT NULL
  ) dupes
  WHERE rn > 1
);
