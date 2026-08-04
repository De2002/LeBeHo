import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import logoBlack from "@/assets/lebeho-black-icon.png";
import logoWhite from "@/assets/lebeho-white-icon.png";
import { Search, Bell, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/authService";
import { useState, useRef } from "react";
import NotificationPanel from "@/components/features/NotificationPanel";
import AuthModal from "@/components/features/AuthModal";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import type { AuthUser } from "@/lib/authService";

type AuthMode = "login" | "signup";

export default function Header() {
  const { user, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const bellRef = useRef<HTMLButtonElement>(null);
  const { unreadCount } = useNotifications();

  const displayUser: AuthUser | null = user ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out.");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  // Hide header on certain pages that have their own back nav
  const isDetailPage = location.pathname.startsWith("/post/") ||
                       location.pathname.startsWith("/edit/") ||
                       location.pathname === "/create";

  return (
    <>
      {/* Desktop + non-mobile detail header */}
      <header className={`sticky top-0 z-40 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] ${isDetailPage ? "hidden sm:block" : ""}`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex flex-col leading-none group" aria-label="LeBeHo home">
            <div className="flex items-center gap-2">
              <img
                src={resolvedTheme === "dark" ? logoWhite : logoBlack}
                alt="LeBeHo"
                className="w-7 h-7 object-contain flex-shrink-0"
              />
              <span className="text-xl font-extrabold tracking-tight text-[hsl(var(--text-primary))]">
                LeBeHo
              </span>
            </div>
            <span className="text-[10px] text-[hsl(var(--text-muted))] font-medium pl-9 -mt-0.5">
              Broadcasting honesty.
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                  placeholder="Search..."
                  className="w-40 sm:w-52 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-full px-3 py-1.5 text-sm outline-none focus:border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))]"
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1.5 text-[hsl(var(--text-muted))]">
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2.5 rounded-full hover:bg-[hsl(var(--background))] text-[hsl(var(--text-secondary))] transition-colors" aria-label="Search">
                <Search size={18} />
              </button>
            )}

            {/* Bell — signed in only */}
            {!loading && user && (
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative p-2.5 rounded-full hover:bg-[hsl(var(--background))] text-[hsl(var(--text-secondary))] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] rounded-full bg-[hsl(var(--accent))] text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none tabular-nums">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={bellRef} />
              </div>
            )}

            {/* Avatar / Sign in */}
            {!loading && displayUser ? (
              <Link to={`/profile/${displayUser.username || displayUser.id}`} className="ml-0.5">
                <img
                  src={displayUser.avatar}
                  alt={displayUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[hsl(var(--border))] hover:opacity-85 transition-opacity"
                />
              </Link>
            ) : !loading ? (
              <div className="flex items-center gap-1 ml-1">
                <button onClick={() => openAuth("login")} className="text-sm font-semibold text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] px-2 py-1.5 transition-colors hidden sm:block">
                  Sign In
                </button>
                <button onClick={() => openAuth("signup")} className="bg-[hsl(var(--accent))] text-white text-sm font-semibold px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                  Join
                </button>
                <button onClick={() => openAuth("signup")} className="sm:hidden p-2" aria-label="Sign in">
                  <UserCircle size={20} className="text-[hsl(var(--text-secondary))]" />
                </button>
              </div>
            ) : (
              <div className="ml-1 w-8 h-8 rounded-full bg-[hsl(var(--border))] animate-pulse" />
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </>
  );
}
