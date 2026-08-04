import { ExternalLink, Link as LinkIcon } from "lucide-react";
import type { Source } from "@/types";

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[15px] font-bold text-[hsl(var(--text-primary))] mb-3">
        Sources ({sources.length})
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((source) => {
          const domain = (() => {
            try { return new URL(source.url).hostname.replace("www.", ""); }
            catch { return source.url; }
          })();
          return (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--text-muted))] transition-colors group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--background))] flex items-center justify-center border border-[hsl(var(--border))]">
                {source.favicon ? (
                  <img src={source.favicon} alt="" className="w-4 h-4 object-contain" />
                ) : (
                  <LinkIcon size={13} className="text-[hsl(var(--text-muted))]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate leading-snug">
                  {source.title}
                </p>
                <p className="text-[11px] text-[hsl(var(--text-muted))] truncate">{domain}</p>
              </div>
              <ExternalLink size={13} className="flex-shrink-0 text-[hsl(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
