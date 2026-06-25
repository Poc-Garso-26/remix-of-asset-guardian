CREATE POLICY "Authenticated users can read asset qrcodes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'asset-qrcodes');