/*
# Crear tabla de documentos y almacenamiento de PDFs

## Resumen
Esta migración crea la base de datos para Kelex: la tabla que guarda cada
documento generado por un usuario (el prompt original, el código LaTeX,
la paleta de colores y el enlace al PDF), junto con el almacenamiento
privado donde se guardan los archivos PDF compilados.

## Tabla nueva: `documents`
- `id` (uuid, clave primaria): identificador único del documento.
- `user_id` (uuid): el usuario dueño del documento. Se completa
  automáticamente con el usuario autenticado.
- `title` (text): título del documento, generado o editado por el usuario.
- `prompt` (text): las indicaciones originales que escribió el usuario.
- `color_palette` (jsonb): la paleta de colores elegida (texto libre o swatches).
- `latex_code` (text): el código LaTeX generado/editado.
- `pdf_url` (text): ruta/URL del PDF compilado en el almacenamiento.
- `created_at` / `updated_at` (timestamptz): marcas de tiempo.

## Seguridad
- Se activa Row Level Security (seguridad a nivel de fila) en `documents`.
- Se agregan 4 políticas separadas (una por operación: leer, crear,
  actualizar, borrar) para que cada usuario autenticado solo pueda ver
  y modificar sus propios documentos.
- Se crea el bucket de almacenamiento privado `pdfs` para los archivos PDF,
  con políticas para que cada usuario solo acceda a sus propios archivos
  (organizados en carpetas por user_id).

## Notas importantes
1. Un disparador (`trigger`) mantiene `updated_at` actualizado automáticamente
   cada vez que se edita un documento.
2. El bucket `pdfs` es privado: el acceso a cada PDF se hace mediante
   enlaces firmados generados por el backend, nunca de forma pública abierta.
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Documento sin título',
  prompt text NOT NULL DEFAULT '',
  color_palette jsonb,
  latex_code text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_user_id_created_at_idx
  ON documents (user_id, created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_documents_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;
CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_documents_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "select_own_pdfs" ON storage.objects;
CREATE POLICY "select_own_pdfs" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "insert_own_pdfs" ON storage.objects;
CREATE POLICY "insert_own_pdfs" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "update_own_pdfs" ON storage.objects;
CREATE POLICY "update_own_pdfs" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "delete_own_pdfs" ON storage.objects;
CREATE POLICY "delete_own_pdfs" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text
  );
