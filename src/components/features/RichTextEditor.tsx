import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, List, Quote, FileText } from "lucide-react";

/** Detect if a string looks like Markdown */
function looksLikeMarkdown(text: string): boolean {
  const lines = text.split("\n");
  let mdLines = 0;
  for (const line of lines) {
    if (
      /^#{1,6}\s/.test(line) ||
      /^[-*+]\s/.test(line) ||
      /^\d+\.\s/.test(line) ||
      /^>\s/.test(line) ||
      /^```/.test(line) ||
      /\*\*.+\*\*/.test(line) ||
      /\*.+\*/.test(line) ||
      /^---+$/.test(line) ||
      /^===+$/.test(line) ||
      /\[.+\]\(.+\)/.test(line)
    ) {
      mdLines++;
    }
  }
  return mdLines >= 1 && (mdLines / lines.filter((l) => l.trim()).length) > 0.2;
}

/** Convert Markdown text to HTML */
function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let olIndex = 0;

  const closeUl = () => { if (inUl) { output.push("</ul>"); inUl = false; } };
  const closeOl = () => { if (inOl) { output.push("</ol>"); inOl = false; olIndex = 0; } };
  const closeCode = () => { if (inCode) { output.push("</pre>"); inCode = false; } };

  function processInline(text: string): string {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    if (/^```/.test(line)) {
      if (inCode) {
        closeCode();
      } else {
        closeUl(); closeOl();
        output.push("<pre>");
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      output.push(line.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    // Headings
    const h6 = line.match(/^######\s+(.+)/);
    const h5 = line.match(/^#####\s+(.+)/);
    const h4 = line.match(/^####\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h6) { closeUl(); closeOl(); output.push(`<h6>${processInline(h6[1])}</h6>`); continue; }
    if (h5) { closeUl(); closeOl(); output.push(`<h5>${processInline(h5[1])}</h5>`); continue; }
    if (h4) { closeUl(); closeOl(); output.push(`<h4>${processInline(h4[1])}</h4>`); continue; }
    if (h3) { closeUl(); closeOl(); output.push(`<h3>${processInline(h3[1])}</h3>`); continue; }
    if (h2) { closeUl(); closeOl(); output.push(`<h2>${processInline(h2[1])}</h2>`); continue; }
    if (h1) { closeUl(); closeOl(); output.push(`<h1>${processInline(h1[1])}</h1>`); continue; }

    // Blockquote
    const bq = line.match(/^>\s?(.*)/);
    if (bq) { closeUl(); closeOl(); output.push(`<blockquote>${processInline(bq[1])}</blockquote>`); continue; }

    // Unordered list
    const ul = line.match(/^[-*+]\s+(.+)/);
    if (ul) {
      closeOl();
      if (!inUl) { output.push("<ul>"); inUl = true; }
      output.push(`<li>${processInline(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.+)/);
    if (ol) {
      closeUl();
      if (!inOl) { output.push("<ol>"); inOl = true; olIndex = 0; }
      olIndex++;
      output.push(`<li>${processInline(ol[1])}</li>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      closeUl(); closeOl();
      output.push("<hr />");
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeUl(); closeOl();
      output.push("<br />");
      continue;
    }

    // Paragraph
    closeUl(); closeOl();
    output.push(`<p>${processInline(line)}</p>`);
  }

  closeUl(); closeOl(); closeCode();
  return output.join("\n");
}

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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const plain = e.clipboardData.getData("text/plain");
    if (!plain || !looksLikeMarkdown(plain)) return;
    // Markdown detected — convert and insert as HTML
    e.preventDefault();
    const html = markdownToHtml(plain);
    // Insert at cursor via execCommand for undo-stack compatibility
    document.execCommand("insertHTML", false, html);
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
        {/* Markdown paste hint */}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-[hsl(var(--text-muted))] select-none">
          <FileText size={9} aria-hidden />
          Paste Markdown to auto-convert
        </span>
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
          onPaste={handlePaste}
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
