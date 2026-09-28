CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  asset TEXT,
  timeframe TEXT,
  market TEXT,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analyses_user_created_idx ON public.analyses (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own analyses select" ON public.analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own analyses insert" ON public.analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own analyses delete" ON public.analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Own charts read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own charts upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own charts delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'charts' AND (storage.foldername(name))[1] = auth.uid()::text);