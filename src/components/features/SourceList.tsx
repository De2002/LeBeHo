import { ExternalLink, FileText, Video, Globe, BookOpen, BarChart2 } from "lucide-react";
import type { Source } from "@/types";

const SOURCE_ICONS = {
  article: FileText,
  research: BookOpen,
  video: Video,
  report: BarChart2,
  website: Globe,
};

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-2">
        Sources
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((source) => {
          const Icon = SOURCE_ICONS[source.type] ?? Globe;
          return (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors duration-150 group"
            >
              <Icon size={12} className="flex-shrink-0 text-[hsl(var(--text-muted))]" />
              <span className="underline underline-offset-2 decoration-[hsl(var(--border))] group-hover:decoration-[hsl(var(--text-primary))] transition-colors">
                {source.title}
              </span>
              <ExternalLink size={10} className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
