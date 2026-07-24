import { useState, useRef, useCallback } from "react";
import { Plus, X, Loader2, Globe, ExternalLink } from "lucide-react";
import type { Source } from "@/types";

interface SourceInputProps {
  sources: Source[];
  onChange: (sources: Source[]) => void;
}

interface FetchedMeta {
  title: string;
  favicon: string;
}

async function fetchUrlMeta(url: string): Promise<FetchedMeta> {
  // Use a public favicon service + page title via allorigins proxy
  const encodedUrl = encodeURIComponent(url);
  const hostname = new URL(url).hostname;
  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

  // Try to fetch title via allorigins CORS proxy
  let title = hostname;
  try {
    const resp = await fetch(
      `https://api.allorigins.win/get?url=${encodedUrl}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (resp.ok) {
      const data = await resp.json();
      const match = (data.contents as string).match(/<title[^>]*>([^<]+)<\/title>/i);
      if (match?.[1]) {
        title = match[1].trim().slice(0, 120);
      }
    }
  } catch {
    // fall back to hostname
  }

  return { title, favicon };
}

export default function SourceInput({ sources, onChange }: SourceInputProps) {
  const [showForm, setShowForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [favicon, setFavicon] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUrlChange = useCallback(
    async (raw: string) => {
      setUrlInput(raw);
      setFetched(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Basic URL validation
      let url: URL;
      try {
        url = new URL(raw.trim());
        if (!["http:", "https:"].includes(url.protocol)) return;
      } catch {
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setFetching(true);
        try {
          const meta = await fetchUrlMeta(url.toString());
          setTitleInput(meta.title);
          setFavicon(meta.favicon);
          setFetched(true);
        } catch {
          // ignore
        } finally {
          setFetching(false);
        }
      }, 600);
    },
    []
  );

  const addSource = () => {
    const cleanUrl = urlInput.trim();
    const cleanTitle = titleInput.trim();
    if (!cleanTitle || !cleanUrl) return;

    const newSource: Source = {
      id: `s-${Date.now()}`,
      title: cleanTitle,
      url: cleanUrl,
      type: "article",
      favicon: favicon || undefined,
    };
    onChange([...sources, newSource]);
    setUrlInput("");
    setTitleInput("");
    setFavicon("");
    setFetched(false);
    setShowForm(false);
  };

  const removeSource = (id: string) => {
    onChange(sources.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
          Sources ({sources.length})
        </label>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="lb-btn-ghost text-[11px] py-1"
          >
            <Plus size={12} />
            Add source
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3 p-3 border border-[hsl(var(--border))] rounded-sm flex flex-col gap-3">
          {/* URL field */}
          <div className="relative">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste URL (title auto-fetched)"
              className="lb-input text-sm pr-7"
              autoFocus
            />
            <div className="absolute right-0 bottom-2.5 flex items-center">
              {fetching && (
                <Loader2 size={13} className="animate-spin text-[hsl(var(--text-muted))]" />
              )}
              {!fetching && fetched && (
                <Globe size={13} className="text-emerald-500" />
              )}
            </div>
          </div>

          {/* Favicon + title preview */}
          {fetched && (
            <div className="flex items-center gap-2 py-2 px-3 border border-[hsl(var(--border-subtle))] rounded-sm bg-[hsl(var(--surface))]">
              {favicon && (
                <img src={favicon} alt="" className="w-4 h-4 flex-shrink-0" aria-hidden />
              )}
              <span className="text-xs text-[hsl(var(--text-secondary))] truncate flex-1">
                {titleInput}
              </span>
              <a
                href={urlInput}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent))] flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Manual title override */}
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={fetching ? "Fetching title…" : "Source title"}
            className="lb-input text-sm"
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setUrlInput("");
                setTitleInput("");
                setFavicon("");
                setFetched(false);
              }}
              className="lb-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addSource}
              disabled={!titleInput.trim() || !urlInput.trim()}
              className="lb-btn-primary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Source list */}
      {sources.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2.5 py-2 lb-divider-subtle text-sm last:border-0"
        >
          {(s as Source & { favicon?: string }).favicon && (
            <img
              src={(s as Source & { favicon?: string }).favicon}
              alt=""
              className="w-3.5 h-3.5 flex-shrink-0"
              aria-hidden
            />
          )}
          {!(s as Source & { favicon?: string }).favicon && (
            <Globe size={12} className="text-[hsl(var(--text-muted))] flex-shrink-0" />
          )}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-[hsl(var(--text-secondary))] truncate hover:text-[hsl(var(--accent))] transition-colors"
          >
            {s.title}
          </a>
          <button
            type="button"
            onClick={() => removeSource(s.id)}
            className="text-[hsl(var(--text-muted))] hover:text-rose-500 transition-colors flex-shrink-0"
            aria-label="Remove source"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
