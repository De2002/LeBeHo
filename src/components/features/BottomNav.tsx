import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, PenLine, Users, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import AuthModal from "@/components/features/AuthModal";

export default function BottomNav() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  // Hide on pages where bottom nav isn't needed
  if (pathname.startsWith("/settings") || pathname.startsWith("/auth")) return null;

  const isActive = (path: string) => {
    if (path === "/" ) return pathname === "/";
    return pathname.startsWith(path);
  };

  const handleWrite = () => {
    if (!user) { setAuthOpen(true); return; }
    navigate("/create");
  };

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[hsl(var(--surface))] border-t border-[hsl(var(--border))] bottom-nav-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {/* Home */}
          <Link to="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center transition-colors ${isActive("/") ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--text-muted))]"}`}>
            <Home size={20} strokeWidth={isActive("/") ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          {/* Write */}
          <button
            onClick={handleWrite}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center transition-colors ${isActive("/create") || isActive("/edit") ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--text-muted))]"}`}
          >
            <PenLine size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">Write</span>
          </button>

          {/* FAB */}
          <button
            onClick={handleWrite}
            className="flex items-center justify-center w-13 h-13 rounded-full bg-[hsl(var(--accent))] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all -mt-5"
            style={{ width: 52, height: 52 }}
            aria-label="Create post"
          >
            <PenLine size={22} strokeWidth={2} />
          </button>

          {/* Community */}
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center text-[hsl(var(--text-muted))] transition-colors">
            <Users size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">Spaces</span>
          </button>

          {/* Profile */}
          {user ? (
            <Link
              to={`/profile/${user.username || user.id}`}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center transition-colors ${isActive("/profile") ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--text-muted))]"}`}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <UserCircle size={20} strokeWidth={1.8} />
              )}
              <span className="text-[10px] font-semibold">Profile</span>
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] min-h-[44px] justify-center text-[hsl(var(--text-muted))] transition-colors"
            >
              <UserCircle size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">Profile</span>
            </button>
          )}
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode="signup" />
    </>
  );
}
