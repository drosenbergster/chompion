-- Allow users to manage rating categories with user_id (universal categories)
CREATE POLICY "Users can manage own universal rating categories" ON public.rating_categories
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to view their universal categories
CREATE POLICY "Users can select own universal rating categories" ON public.rating_categories
  FOR SELECT USING (user_id = auth.uid());
