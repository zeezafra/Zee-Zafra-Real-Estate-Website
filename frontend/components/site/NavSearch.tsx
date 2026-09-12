"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/properties?q=${encodeURIComponent(q)}` : "/properties");
    setOpen(false);
    setValue("");
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search properties"
        onClick={() => setOpen(true)}
        className="text-offwhite/90 transition hover:text-gold"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 rounded-full bg-navy/70 px-3 py-1.5 ring-1 ring-offwhite/30 backdrop-blur"
    >
      <Search size={15} className="shrink-0 text-offwhite/70" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!value) setOpen(false);
        }}
        placeholder="Search title or location"
        className="w-40 bg-transparent text-sm text-offwhite placeholder:text-offwhite/50 focus:outline-none"
      />
      <button
        type="button"
        aria-label="Close search"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
        className="shrink-0 text-offwhite/60 transition hover:text-offwhite"
      >
        <X size={14} />
      </button>
    </form>
  );
}
