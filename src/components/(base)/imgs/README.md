# Guía: subir y eliminar imágenes (`components/imgs`)

Módulo reutilizable para seleccionar, recortar, comprimir y subir imágenes a **Supabase Storage**. El componente **no guarda la imagen en la base de datos**; solo devuelve el **path relativo** del archivo en el bucket. Persistir ese path en tu tabla es responsabilidad del formulario o modal padre.

---

## Archivos del módulo

| Archivo | Responsabilidad |
|---|---|
| `ImageUploader.tsx` | UI: preview, drag & drop, subida, eliminación, lupa |
| `ImageEditorModal.tsx` | Recorte, zoom y rotación antes de subir (`react-easy-crop`) |
| `cropImage.ts` | Utilidad pura: recorte/rotación con `<canvas>` → `File` |

**Dependencias npm:**

- `browser-image-compression`
- `react-easy-crop`
- Cliente Supabase: `@/utils/supabase/client`

**Autenticación / roles:** el componente usa `useUser` de `@/components/(base)/providers/UserProvider` (no hooks externos).

---

## 1. Configurar Supabase Storage

### Crear el bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Nombre, por ejemplo: `ventas-comprobantes`
3. Marcar como **Private** (el preview usa signed URLs, no URLs públicas)

### Políticas RLS

RLS aplica sobre `storage.objects`. Sin políticas, nadie puede leer ni subir.

Política recomendada para usuarios autenticados (SQL Editor):

```sql
CREATE POLICY "Authenticated all ventas-comprobantes"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'ventas-comprobantes')
WITH CHECK (bucket_id = 'ventas-comprobantes');
```

Desde el Dashboard: operación **ALL**, rol **authenticated**, condición `bucket_id = 'nombre-del-bucket'`.

### Columna en la tabla

Agregar un campo `text` nullable que guarde solo el path del archivo:

```sql
ALTER TABLE mi_tabla
  ADD COLUMN IF NOT EXISTS img_comprobante_url text;
```

Ejemplo en ventas (`ven_ventas`):

```sql
ALTER TABLE ven_ventas
  ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'Efectivo',
  ADD COLUMN IF NOT EXISTS numero_boleta text,
  ADD COLUMN IF NOT EXISTS banco text,
  ADD COLUMN IF NOT EXISTS fecha_transferencia date,
  ADD COLUMN IF NOT EXISTS img_comprobante_url text;
```

---

## 2. API de `ImageUploader`

### Props

```tsx
<ImageUploader
  bucketName="ventas-comprobantes"
  currentImagePath={imgPath}              // path en DB, o null
  onUploadSuccess={async (newPath) => { /* persistir en DB o estado del form */ }}
  onDeleteSuccess={async () => { /* poner null en DB o estado */ }}
  disabled={false}
  signedUrlExpiresIn={3600}               // segundos del preview (default 3600)
  aspect={4 / 3}
  aspectLabel="Horizontal 4:3"
  permitirTodos={true}                    // cualquier usuario autenticado puede subir
  botonesExternos={false}                 // true = botones en el padre vía ref
  onEstadoChange={({ uploading, deleting }) => ...}
  previewClassName="max-h-[200px]"
/>
```

### Permisos de subida

- `permitirTodos={true}` → cualquier usuario con sesión activa (`useUser()` no null).
- `permitirTodos={false}` (default) → solo roles: `super`, `admin`, `rrhh`, `ventas`.

Los roles se leen de `user.user_metadata.rol` o `user.role`, en minúsculas (convención de este proyecto).

### Ref imperativa (`ImageUploaderHandle`)

Con `botonesExternos={true}`:

```tsx
const uploaderRef = useRef<ImageUploaderHandle>(null);

uploaderRef.current?.openGallery();
uploaderRef.current?.openCamera();
await uploaderRef.current?.deleteImage();

uploaderRef.current?.tieneImagen;
uploaderRef.current?.puedeSubir;
uploaderRef.current?.uploading;
uploaderRef.current?.deleting;
uploaderRef.current?.isProcessing;
```

---

## 3. Flujo de subida

```
Usuario selecciona imagen (galería / cámara / drag & drop)
        ↓
Validación: solo JPG, PNG, WebP
        ↓
ImageEditorModal (recorte + zoom + rotación)
        ↓
cropImage.ts → File recortado
        ↓
browser-image-compression → JPEG ≤ 0.1 MB, máx 1024px
        ↓
Nombre único: {timestamp}-{random}.jpg
        ↓
supabase.storage.from(bucket).upload(newPath, blob)
        ↓
Si había imagen anterior → storage.remove([currentImagePath])
        ↓
onUploadSuccess(newPath)  ← el PADRE persiste el path
```

## 4. Flujo de eliminación

```
Usuario pulsa Eliminar → confirm()
        ↓
storage.remove([currentImagePath])
        ↓
onDeleteSuccess()  ← el PADRE pone null en la columna
```

---

## 5. Integración en un formulario (ej. ventas)

En `sale-modal.tsx`, para transferencias:

```tsx
import ImageUploader from "@/components/(base)/imgs/ImageUploader";

const BUCKET = "ventas-comprobantes";
const imgComprobante = watch("img_comprobante_url");

<ImageUploader
  bucketName={BUCKET}
  currentImagePath={imgComprobante ?? null}
  onUploadSuccess={(path) => setValue("img_comprobante_url", path)}
  onDeleteSuccess={() => setValue("img_comprobante_url", null)}
  disabled={isReadOnly}
  permitirTodos
  aspect={4 / 3}
  aspectLabel="Horizontal 4:3"
  previewClassName="max-h-[200px]"
/>
```

Al guardar el formulario, incluir `img_comprobante_url` en el `insert`/`update` de la tabla.

### Server action (persistir path)

```ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarImagenVenta(
  ventaId: string,
  path: string | null,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ven_ventas")
    .update({ img_comprobante_url: path })
    .eq("id", ventaId);

  if (error) throw new Error(error.message);

  revalidatePath("/cermadsa/laarada/ventas");
  return { path };
}
```

Si el path se guarda junto con el resto del formulario (como en ventas), no hace falta una action aparte solo para la imagen.

---

## 6. Checklist para un módulo nuevo

1. Crear bucket **privado** en Supabase Storage.
2. Agregar política RLS `FOR ALL TO authenticated` con `bucket_id = 'tu-bucket'`.
3. Agregar columna `text` nullable en la entidad.
4. Montar `ImageUploader` en el formulario o modal.
5. En `onUploadSuccess` / `onDeleteSuccess`, actualizar estado local o DB.
6. Usar `permitirTodos` si el rol del módulo no está en la lista privilegiada.
7. Refrescar listado tras guardar (`invalidateQueries` o `revalidatePath`).

---

## Buckets en uso

| Módulo | Bucket |
|---|---|
| Ventas (comprobante transferencia) | `ventas-comprobantes` |

---

## Responsabilidades

| Capa | Hace |
|---|---|
| `ImageUploader` | Selección, recorte, compresión, upload/delete en Storage, preview con signed URL |
| Formulario / modal padre | Estado local, UI, `setValue` o server action al subir/borrar |
| Server action | `UPDATE` del path en la tabla |
| Supabase Storage + RLS | Almacenamiento y permisos de archivos |
