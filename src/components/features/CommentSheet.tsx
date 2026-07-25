import { useEffect, useRef } from "react";
import { X, MessageSquare } from "lucide-react";
import CommentSection from "./CommentSection";

interface CommentSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
  onCountChange?: (count: number) => void;
}

export default function CommentSheet({
  open,
  onClose,
  postId,
  commentsCount,
  onCountChange,
}: CommentSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Touch drag-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      currentYRef.current = delta;
    }
  };
  const handleTouchEnd = () => {
    if (currentYRef.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col
          bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]
          rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out
          max-h-[88vh] sm:max-h-[80vh]
          sm:max-w-2xl sm:mx-auto sm:left-0 sm:right-0
          ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ willChange: "transform" }}
      >
        {/* Drag handle area — touchable */}
        <div
          className="flex flex-col items-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-[hsl(var(--border))]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0 border-b border-[hsl(var(--border-subtle))]">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-[hsl(var(--text-muted))]" />
            <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">
              Discussion
            </span>
            {commentsCount > 0 && (
              <span className="text-xs text-[hsl(var(--text-muted))] font-normal">
                · {commentsCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="lb-btn-ghost p-1.5 -mr-1"
            aria-label="Close comments"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable comment area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
          {open && (
            <CommentSection
              postId={postId}
              initialCount={commentsCount}
              onCountChange={onCountChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
