
import { useCallback, useRef, useState } from "react";
import { X, Upload, Link as LinkIcon } from "lucide-react";

interface ImageDropZoneProps {
  value: string;
  onChange: (url: string, file?: File) => void;
}

export default function ImageDropZone({ value, onChange }: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep a stable ref to onChange so callbacks don't go stale
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    // Pass the File directly — preview via object URL, upload on submit
    const previewUrl = URL.createObjectURL(file);
    onChangeRef.current(previewUrl, file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    // Reset input so the same file can be re-selected if removed
    e.target.value = "";
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlMode(false);
      setUrlInput("");
    }
  };

  if (value) {
    return (
      <div className="relative group mb-4">
        <img
          src={value}
          alt="Post image preview"
          className="w-full h-52 object-cover rounded-sm border border-[hsl(var(--border))]"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-2 right-2 p-1.5 rounded-sm bg-[hsl(var(--background)/0.9)] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove image"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {urlMode ? (
        <form onSubmit={handleUrlSubmit} className="flex gap-2 items-center">
          <input
            autoFocus
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL..."
            className="lb-input text-sm flex-1"
          />
          <button type="submit" className="lb-btn-primary py-1.5 px-3 text-xs">
            Use
          </button>
          <button
            type="button"
            onClick={() => setUrlMode(false)}
            className="lb-btn-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2 py-8
            border border-dashed rounded-sm cursor-pointer select-none
            transition-all duration-150
            ${
              dragging
                ? "border-[hsl(var(--text-primary))] bg-[hsl(var(--surface))]"
                : "border-[hsl(var(--border))] hover:border-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface)/0.5)]"
            }
          `}
          role="button"
          aria-label="Upload image"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <Upload
            size={20}
            className={`transition-colors duration-150 ${
              dragging
                ? "text-[hsl(var(--text-primary))]"
                : "text-[hsl(var(--text-muted))]"
            }`}
          />
          <div className="text-center">
            <p className="text-sm text-[hsl(var(--text-secondary))]">
              {dragging ? "Drop to upload" : "Drop image here or click to browse"}
            </p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
              PNG, JPG, WebP up to any size
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUrlMode(true);
            }}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <LinkIcon size={10} />
            Use URL
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            tabIndex={-1}
          />
        </div>
      )}
    </div>
  );
}
