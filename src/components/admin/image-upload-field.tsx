"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadBnbImage } from "@/app/admin/[bnbId]/actions";
import { Input } from "@/components/admin/field";
import { Button } from "@/components/ui/button";

/** Lato massimo (px) per tipo di immagine: oltre, si ridimensiona. */
const SLOT_MAX_SIZE = { logo: 512, hero: 1600, posto: 1200 } as const;

type Slot = keyof typeof SLOT_MAX_SIZE;

/** Sotto questo peso un'immagine già piccola si carica senza ricomprimerla. */
const KEEP_ORIGINAL_BYTES = 300 * 1024;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Ridimensiona l'immagine nel browser prima dell'upload (foto da telefono =
 * anche 10+ MB: ridotte qui passano il limite dei 5 MB e pesano poco per gli
 * ospiti). Preferisce WebP; se il browser non lo sa codificare (toBlob può
 * ripiegare su PNG) usa PNG per i loghi trasparenti e JPEG per le foto.
 */
async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("immagine non leggibile"));
      el.src = url;
    });

    const scale = Math.min(
      1,
      maxSize / Math.max(img.naturalWidth, img.naturalHeight),
    );
    if (scale === 1 && file.size <= KEEP_ORIGINAL_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fallback = file.type === "image/png" ? "image/png" : "image/jpeg";
    for (const type of ["image/webp", fallback]) {
      const blob = await canvasToBlob(canvas, type, 0.85);
      if (blob && blob.type === type) return blob;
    }
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface ImageUploadFieldProps {
  /** Slug della struttura: decide la cartella su Storage (e la RLS). */
  bnbId: string;
  /** Nome del campo nel form (es. logoUrl, heroImage, image_url). */
  name: string;
  slot: Slot;
  defaultValue: string;
  id?: string;
}

/**
 * Campo URL immagine + pulsante "Carica": il file scelto viene ridimensionato
 * nel browser, caricato su Supabase Storage via server action e l'URL pubblico
 * finisce nell'input (non controllato: `form.reset()` continua a funzionare e
 * il valore viaggia col form al salvataggio, come prima).
 */
export function ImageUploadField({
  bnbId,
  name,
  slot,
  defaultValue,
  id,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultValue);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const blob = await resizeImage(file, SLOT_MAX_SIZE[slot]);
        const ext =
          blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
        const formData = new FormData();
        formData.set("file", new File([blob], `${slot}.${ext}`, { type: blob.type }));
        formData.set("slot", slot);

        const result = await uploadBnbImage(bnbId, formData);
        if (!result.ok) {
          setNotice({ ok: false, text: result.error });
          return;
        }
        if (inputRef.current) inputRef.current.value = result.url;
        setPreview(result.url);
        setNotice({ ok: true, text: "Immagine caricata: ricordati di salvare." });
      } catch {
        setNotice({
          ok: false,
          text: "Impossibile leggere l'immagine. Usa un file JPG, PNG o WebP.",
        });
      } finally {
        // Permette di ricaricare lo stesso file (onChange non scatterebbe).
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {preview && (
          <img
            src={preview}
            alt=""
            onError={() => setPreview("")}
            className="size-10 shrink-0 rounded-lg border border-border object-cover"
          />
        )}
        <Input
          ref={inputRef}
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder="https://…"
          onInput={(e) => {
            setPreview(e.currentTarget.value.trim());
            setNotice(null);
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Scegli un'immagine da caricare"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          className="h-11 shrink-0 gap-1.5 rounded-xl px-3.5"
        >
          <Upload className="size-4" aria-hidden />
          {pending ? "Carico…" : "Carica"}
        </Button>
      </div>
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={
            notice.ok
              ? "text-xs font-medium text-terracotta"
              : "text-xs font-medium text-destructive"
          }
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
