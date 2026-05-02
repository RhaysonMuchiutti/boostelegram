-- Grant select on telegram_connections for authenticated users to see their own data
CREATE POLICY "Users can view their own telegram connections"
ON public.telegram_connections
FOR SELECT
USING (auth.uid() = user_id);
