import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, List, Quote } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minRows = 6,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const minHeight = minRows * 24;

  // Sync external value on mount only
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      exec("bold");
    }
    if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      exec("italic");
    }
  };

  const isEmpty =
    !value || value === "<br>" || value === "<div><br></div>" || value === "";

  return (
    <div className="group">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 mb-2 pb-2 border-b border-[hsl(var(--border-subtle))]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mr-2">
          Format
        </span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("bold");
          }}
          className="p-1.5 rounded-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold size={12} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("italic");
          }}
          className="p-1.5 rounded-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic size={12} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          className="p-1.5 rounded-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List size={12} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "blockquote");
          }}
          className="p-1.5 rounded-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
          title="Blockquote"
          aria-label="Blockquote"
        >
          <Quote size={12} />
        </button>
      </div>

      {/* Editor area */}
      <div className="relative">
        {isEmpty && (
          <p
            className="absolute top-0 left-0 text-sm text-[hsl(var(--text-muted))] pointer-events-none select-none leading-relaxed"
            aria-hidden
          >
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="outline-none text-sm text-[hsl(var(--text-primary))] leading-relaxed min-h-0 focus:outline-none rich-editor"
          style={{ minHeight }}
          aria-label="Explanation"
          aria-multiline="true"
          role="textbox"
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[hsl(var(--border))] group-focus-within:bg-[hsl(var(--text-primary))] transition-colors duration-150" />
      </div>
    </div>
  );
}
