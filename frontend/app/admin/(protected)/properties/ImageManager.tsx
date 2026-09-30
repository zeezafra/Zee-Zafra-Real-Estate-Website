"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Star, X } from "lucide-react";

// Phase 27. One ordered list of photos — the first item is always the
// listing's cover (what PropertyCard/PropertyGallery show first). Each
// item is either an already-uploaded URL or a File picked just now;
// PropertyForm uploads the File items on submit and rebuilds the final
// `images` URL array in this same order (see toImagesPayload below).
export type PhotoItem =
  | { key: string; kind: "existing"; url: string }
  | { key: string; kind: "new"; file: File; preview: string };

let nextKey = 0;
function makeKey() {
  nextKey += 1;
  return `photo-${Date.now()}-${nextKey}`;
}

export function photosFromUrls(urls: string[]): PhotoItem[] {
  return urls.map((url) => ({ key: makeKey(), kind: "existing", url }));
}

export function filesToPhotos(files: File[]): PhotoItem[] {
  return files.map((file) => ({ key: makeKey(), kind: "new", file, preview: URL.createObjectURL(file) }));
}

function move<T>(list: T[], from: number, to: number): T[] {
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function ImageManager({
  photos,
  onChange,
}: {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onChange([...photos, ...filesToPhotos(Array.from(fileList))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function moveTo(index: number, target: number) {
    if (target < 0 || target >= photos.length || target === index) return;
    onChange(move(photos, index, target));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    onChange(move(photos, index, 0));
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    onChange(move(photos, dragIndex, targetIndex));
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div>
      <span className="block text-sm font-medium text-navy">Photos</span>
      <p className="mt-1 text-xs text-navy/50">
        Drag to reorder, or use the arrows. The first photo is the cover shown on the site.
      </p>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => {
            const src = photo.kind === "existing" ? photo.url : photo.preview;
            const isCover = index === 0;
            const isDragging = dragIndex === index;
            const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;

            return (
              <div
                key={photo.key}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnter={() => setOverIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`group relative aspect-square cursor-move overflow-hidden rounded-lg border transition ${
                  isCover ? "border-gold ring-2 ring-gold" : "border-navy/10"
                } ${isDragging ? "opacity-40" : ""} ${isDropTarget ? "ring-2 ring-navy/40" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full select-none object-cover" draggable={false} />

                {isCover && (
                  <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
                    <Star size={10} fill="currentColor" /> Cover
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-navy/80 px-1 py-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveTo(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Move left"
                    className="rounded p-1 text-white disabled:opacity-30"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => makeCover(index)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white hover:text-gold"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => moveTo(index, index + 1)}
                    disabled={index === photos.length - 1}
                    aria-label="Move right"
                    className="rounded p-1 text-white disabled:opacity-30"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-navy/80 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="mt-3 block w-full text-sm text-navy/70 file:mr-4 file:rounded-full file:border-0 file:bg-navy/5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/10"
      />
    </div>
  );
}
