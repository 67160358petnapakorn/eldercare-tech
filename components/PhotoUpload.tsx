"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { API_BASE_URL, uploadPhoto } from "@/lib/api";

export default function PhotoUpload({
  photoUrl,
  fallback,
  size = 56,
  onUploaded,
  onError,
}: {
  photoUrl?: string | null;
  fallback: React.ReactNode;
  size?: number;
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadPhoto(file);
      onUploaded(url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${API_BASE_URL}${photoUrl}`}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{fallback}</div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="เปลี่ยนรูปภาพ"
        className={`absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/40 hover:text-white disabled:cursor-wait ${
          uploading ? "bg-black/40 text-white" : "bg-black/0 text-transparent"
        }`}
      >
        {uploading ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
