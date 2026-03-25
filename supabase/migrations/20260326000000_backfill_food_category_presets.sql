-- Backfill food-specific rating category presets for existing passion foods
-- that still have the untouched generic defaults (Taste, Quality, Ambiance, Presentation, Value at 0.2 each).
-- Skips any food whose categories have already been customized by the user.
-- After updating categories, recalculates composite_score on affected entries.

DO $$
DECLARE
  food_rec RECORD;
  preset_cats JSONB;
  cat_count INTEGER;
  default_count INTEGER;
  i INTEGER;
  entry_rec RECORD;
  new_composite NUMERIC;
BEGIN
  FOR food_rec IN
    SELECT pf.id, pf.theme_key
    FROM passion_foods pf
    WHERE pf.theme_key IN (
      'pizza','burgers','coffee','tacos','sushi','pasta',
      'ramen','wine','icecream','sandwiches','burritos','cheese'
    )
  LOOP
    -- Must have exactly 5 categories
    SELECT count(*) INTO cat_count
    FROM rating_categories rc
    WHERE rc.passion_food_id = food_rec.id;

    IF cat_count != 5 THEN
      CONTINUE;
    END IF;

    -- All 5 must still be the untouched defaults
    SELECT count(*) INTO default_count
    FROM rating_categories rc
    WHERE rc.passion_food_id = food_rec.id
      AND rc.name IN ('Taste', 'Quality', 'Ambiance', 'Presentation', 'Value')
      AND abs(rc.weight - 0.2) < 0.01;

    IF default_count != 5 THEN
      CONTINUE;
    END IF;

    -- Look up the preset for this theme
    preset_cats := CASE food_rec.theme_key
      WHEN 'pizza'      THEN '[{"n":"Taste","w":0.25},{"n":"Crust","w":0.25},{"n":"Toppings","w":0.2},{"n":"Value","w":0.15},{"n":"Ambiance","w":0.15}]'::jsonb
      WHEN 'burgers'    THEN '[{"n":"Taste","w":0.25},{"n":"Patty Quality","w":0.25},{"n":"Toppings & Bun","w":0.2},{"n":"Value","w":0.15},{"n":"Ambiance","w":0.15}]'::jsonb
      WHEN 'coffee'     THEN '[{"n":"Flavor","w":0.3},{"n":"Body","w":0.2},{"n":"Aroma","w":0.2},{"n":"Presentation","w":0.15},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'tacos'      THEN '[{"n":"Taste","w":0.3},{"n":"Filling","w":0.25},{"n":"Tortilla","w":0.2},{"n":"Salsa & Sides","w":0.1},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'sushi'      THEN '[{"n":"Freshness","w":0.3},{"n":"Taste","w":0.25},{"n":"Presentation","w":0.2},{"n":"Rice Quality","w":0.1},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'pasta'      THEN '[{"n":"Taste","w":0.25},{"n":"Sauce","w":0.25},{"n":"Noodle Texture","w":0.2},{"n":"Presentation","w":0.15},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'ramen'      THEN '[{"n":"Broth","w":0.3},{"n":"Noodles","w":0.25},{"n":"Toppings","w":0.2},{"n":"Taste","w":0.15},{"n":"Value","w":0.1}]'::jsonb
      WHEN 'wine'       THEN '[{"n":"Flavor","w":0.3},{"n":"Aroma","w":0.2},{"n":"Balance","w":0.2},{"n":"Finish","w":0.15},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'icecream'   THEN '[{"n":"Flavor","w":0.3},{"n":"Texture","w":0.25},{"n":"Quality","w":0.2},{"n":"Presentation","w":0.1},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'sandwiches' THEN '[{"n":"Taste","w":0.25},{"n":"Bread","w":0.2},{"n":"Fillings","w":0.25},{"n":"Freshness","w":0.15},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'burritos'   THEN '[{"n":"Taste","w":0.3},{"n":"Filling","w":0.25},{"n":"Tortilla","w":0.15},{"n":"Portion Size","w":0.15},{"n":"Value","w":0.15}]'::jsonb
      WHEN 'cheese'     THEN '[{"n":"Flavor","w":0.3},{"n":"Texture","w":0.25},{"n":"Aroma","w":0.15},{"n":"Quality","w":0.15},{"n":"Value","w":0.15}]'::jsonb
    END;

    -- Update each category row in place (preserves IDs and entry_ratings FKs)
    FOR i IN 0..4 LOOP
      UPDATE rating_categories
      SET name   = (preset_cats -> i ->> 'n'),
          weight = (preset_cats -> i ->> 'w')::numeric
      WHERE passion_food_id = food_rec.id
        AND sort_order = i;
    END LOOP;

    -- Recalculate composite_score for entries whose ratings reference these categories
    FOR entry_rec IN
      SELECT e.id
      FROM entries e
      WHERE e.passion_food_id = food_rec.id
    LOOP
      SELECT ROUND(SUM(er.score * rc.weight) * 100) / 100
      INTO new_composite
      FROM entry_ratings er
      JOIN rating_categories rc ON rc.id = er.rating_category_id
      WHERE er.entry_id = entry_rec.id
        AND er.score > 0;

      IF new_composite IS NOT NULL THEN
        UPDATE entries
        SET composite_score = new_composite
        WHERE id = entry_rec.id;
      END IF;
    END LOOP;

  END LOOP;
END $$;
