-- Phase 1: Chomp-first redesign
-- - New entry_dishes table for multi-dish per visit
-- - Make passion_food_id nullable (entries can exist without a collection)
-- - Add cuisine column for auto-tagging
-- - Create universal rating categories per user
-- - Migrate existing entries into entry_dishes

-- 1. Create entry_dishes table
CREATE TABLE IF NOT EXISTS public.entry_dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating numeric(2,1) CHECK (rating >= 1 AND rating <= 5),
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entry_dishes_entry
  ON public.entry_dishes (entry_id);

CREATE INDEX IF NOT EXISTS idx_entry_dishes_name
  ON public.entry_dishes (name);

ALTER TABLE public.entry_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entry dishes" ON public.entry_dishes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_dishes.entry_id AND entries.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own entry dishes" ON public.entry_dishes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_dishes.entry_id AND entries.user_id = auth.uid())
  );

CREATE POLICY "Users can update own entry dishes" ON public.entry_dishes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_dishes.entry_id AND entries.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own entry dishes" ON public.entry_dishes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.entries WHERE entries.id = entry_dishes.entry_id AND entries.user_id = auth.uid())
  );

-- Allow friends to see entry dishes (for friend feed)
CREATE POLICY "Users can view followed users entry dishes" ON public.entry_dishes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.entries e
      JOIN public.follows f ON f.following_id = e.user_id
      WHERE e.id = entry_dishes.entry_id AND f.follower_id = auth.uid()
    )
  );

-- 2. Make passion_food_id nullable on entries
ALTER TABLE public.entries ALTER COLUMN passion_food_id DROP NOT NULL;

-- 3. Add cuisine column to entries
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS cuisine text;

-- 4. Create universal rating categories (passion_food_id = NULL, per user)
-- First allow nullable passion_food_id on rating_categories
ALTER TABLE public.rating_categories ALTER COLUMN passion_food_id DROP NOT NULL;

-- Add user_id to rating_categories for universal categories
ALTER TABLE public.rating_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Migrate existing entries -> entry_dishes
-- For each existing entry, create one dish using passion food name (or subtype name)
INSERT INTO public.entry_dishes (entry_id, name, rating, sort_order)
SELECT
  e.id,
  COALESCE(s.name, pf.name, 'Unknown'),
  e.composite_score,
  0
FROM public.entries e
LEFT JOIN public.passion_foods pf ON pf.id = e.passion_food_id
LEFT JOIN public.subtypes s ON s.id = e.subtype_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.entry_dishes ed WHERE ed.entry_id = e.id
);

-- 6. Update notification trigger to handle nullable passion_food_id
CREATE OR REPLACE FUNCTION public.notify_new_entry()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  food_name TEXT;
BEGIN
  IF NEW.passion_food_id IS NOT NULL THEN
    SELECT name INTO food_name FROM public.passion_foods WHERE id = NEW.passion_food_id;
  END IF;

  FOR follower_record IN
    SELECT follower_id FROM public.follows WHERE following_id = NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, actor_id, data)
    VALUES (
      follower_record.follower_id, 'friend_entry', NEW.user_id,
      jsonb_build_object(
        'entry_id', NEW.id,
        'restaurant_name', NEW.restaurant_name,
        'food_name', COALESCE(food_name, '')
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
