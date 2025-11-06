-- Add banner_url column to teams table
ALTER TABLE public.teams
ADD COLUMN banner_url text;

-- Create storage bucket for team banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-banners', 'team-banners', true);

-- Create storage policies for team banners
CREATE POLICY "Anyone can view team banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-banners');

CREATE POLICY "Admins can upload team banners"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'team-banners'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update team banners"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'team-banners'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete team banners"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-banners'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  )
);