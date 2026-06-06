  "use client";

/**
 * <ImageUploader />
 *
 * Reusable drag-and-drop image uploader for admin forms.
 * Calls POST /api/admin/upload for each file, then returns
 * { url, publicId } to the parent via onUpload().
 *
 * Props:
 *   folder         — Cloudinary folder (default: "viit/products")
 *   subSubCategory — e.g. "Denim Jacket" — used to name the image
 *                    Result: denim-jacket-a3f9b2c1d4e5
 *   onUpload       — called with { url, publicId } after successful upload
 *   onDelete       — called with publicId when user removes an already-uploaded image
 *   multiple       — allow multiple files (default: false)
 *   maxFiles       — max number of images (default: 8)
 *   className      — optional extra classes for the wrapper
 *
 * Usage:
 *   <ImageUploader
 *     folder="viit/products"
 *     multiple
 *     maxFiles={6}
 *     onUpload={({ url, publicId }) => addImage(url, publicId)}
 *     onDelete={(publicId) => removeImage(publicId)}
 *   />
 */

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import Image from "next/image";

export type UploadedImage = {
  url: string;
  publicId: string;
};

type ImageUploaderProps = {
  folder?: string;
  subSubCategory: string;          // e.g. "Denim Jacket" → image named "denim-jacket-abc123"
  onUpload: (image: UploadedImage) => void;
  onDelete?: (publicId: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: UploadedImage[];
  className?: string;
};

type FileState = {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: UploadedImage;
};

export default function ImageUploader({
  folder = "viit/products",
  subSubCategory,
  onUpload,
  onDelete,
  multiple = false,
  maxFiles = 8,
  existingImages = [],
  className = "",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const totalImages = existingImages.length + files.filter((f) => f.status === "done").length;
  const canAddMore = totalImages < maxFiles;

  function addFiles(incoming: File[]) {
    const allowed = incoming.filter((f) => f.type.startsWith("image/"));
    const remaining = maxFiles - totalImages;
    const toAdd = allowed.slice(0, remaining);

    const newStates: FileState[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newStates]);

    // Upload each immediately
    newStates.forEach((_, i) => {
      const idx = files.length + i;
      uploadFile(idx + files.length - newStates.length + i, toAdd[i]);
    });

    // Simpler: upload in a loop using the array directly
    toAdd.forEach((file, i) => {
      const globalIdx = files.length + i;
      uploadSingle(file, globalIdx);
    });
  }

  async function uploadSingle(file: File, idx: number) {
    // Mark uploading
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, status: "uploading" } : f))
    );

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('subSubCategory', subSubCategory); // e.g. "Denim Jacket" → "denim-jacket-abc123"
      body.append('folder', folder);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed");
      }

      const result: UploadedImage = { url: data.url, publicId: data.publicId };

      setFiles((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, status: "done", result } : f
        )
      );

      onUpload(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, status: "error", error: message } : f
        )
      );
    }
  }

  // Stub to avoid duplicate call — real work is in uploadSingle
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function uploadFile(_idx: number, _file: File) {}

  async function handleDeleteExisting(publicId: string) {
    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      onDelete?.(publicId);
    } catch {
      // silent — parent handles state
    }
  }

  function handleRemoveLocal(idx: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }
  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = ""; // reset so same file can be re-selected
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-4 ${className}`}>

      {/* Drop zone — only shown when more images can be added */}
      {canAddMore && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors duration-200 select-none
            ${dragging
              ? "border-black bg-gray-50 scale-[1.01]"
              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
            }`}
        >
          {/* Upload icon */}
          <svg
            width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke={dragging ? "#000" : "#9ca3af"}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
            {dragging ? "Drop to upload" : "Drag & drop or click to browse"}
          </p>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            JPG · PNG · WEBP · AVIF · Max 5 MB · {totalImages}/{maxFiles} uploaded
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={multiple}
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Image grid — existing + newly uploaded */}
      {(existingImages.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">

          {/* Existing images (passed from parent) */}
          {existingImages.map((img) => (
            <div key={img.publicId} className="group relative aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={img.url}
                alt="Uploaded"
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
              />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(img.publicId)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  aria-label="Remove image"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Newly added files (uploading / done / error) */}
          {files.map((f, idx) => (
            <div
              key={idx}
              className={`group relative aspect-square rounded-md overflow-hidden border transition-all duration-200
                ${f.status === "error" ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-100"}
              `}
            >
              {/* Preview image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.preview}
                alt="Preview"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  f.status === "uploading" ? "opacity-40" : "opacity-100"
                }`}
              />

              {/* Uploading spinner overlay */}
              {f.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <svg
                    className="animate-spin w-7 h-7 text-black"
                    viewBox="0 0 24 24" fill="none"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                </div>
              )}

              {/* Done checkmark */}
              {f.status === "done" && (
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Error overlay */}
              {f.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-50/90 p-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider text-center leading-tight">
                    {f.error ?? "Failed"}
                  </span>
                </div>
              )}

              {/* Remove button (done or error state) */}
              {(f.status === "done" || f.status === "error") && (
                <button
                  type="button"
                  onClick={() => handleRemoveLocal(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
