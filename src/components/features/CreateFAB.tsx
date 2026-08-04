import { useNavigate, useLocation } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/** Floating Action Button — links to /create. Hidden on the create/edit pages. */
export default function CreateFAB() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Don't show on pages where writing is already the primary action
  // Also hidden on mobile (BottomNav has the FAB there)
  const hidden = pathname === "/create" || pathname.startsWith("/edit/");

  if (loading || !user || hidden) return null;

  return (
    <button
      onClick={() => navigate("/create")}
      aria-label="Create new post"
      className="
        hidden sm:flex
        fixed bottom-6 right-5
        z-40
        w-14 h-14
        rounded-full
        bg-[hsl(var(--accent))]
        text-white
        shadow-lg
        flex items-center justify-center
        transition-all duration-200
        hover:scale-105 hover:shadow-xl
        active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--text-primary))] focus-visible:ring-offset-2
      "
    >
      <PenLine size={22} strokeWidth={2} />
    </button>
  );
}
