CREATE POLICY "field report photos readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'field-reports');

CREATE POLICY "field report photos uploadable by authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'field-reports');

CREATE POLICY "field report photos updatable by owner"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'field-reports' AND owner = auth.uid());