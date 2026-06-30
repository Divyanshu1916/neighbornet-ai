
CREATE POLICY "Anyone can view issue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-images');

CREATE POLICY "Anyone can upload issue images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'issue-images');
