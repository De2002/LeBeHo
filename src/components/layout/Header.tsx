import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import logoBlack from "@/assets/lebeho-black-icon.png";
import logoWhite from "@/assets/lebeho-white-icon.png";
import { PenLine, Search, Bell, LogOut, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/authService";
import { getStoredUser } from "@/lib/auth";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  // Use real auth user if signed in, else fall back to mock avatar for layout
  const mockUser = getStoredUser();
  const displayUser: AuthUser | null = user ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      await signOut();
      toast.success("Signed out.");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[hsl(var(--background))] lb-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center gap-2 group"
            aria-label="LeBeHo home"
          >
            <img
              src={resolvedTheme === "dark" ? logoWhite : logoBlack}
              alt="LeBeHo"
              className="w-8 h-8 object-contain flex-shrink-0 group-hover:opacity-80 transition-opacity"
            />
            <span className="text-lg font-extrabold tracking-tight text-[hsl(var(--text-primary))] group-hover:opacity-80 transition-opacity">
              LeBeHo
            </span>
            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--text-muted))] border border-[hsl(var(--border))] px-1.5 py-0.5 rounded-sm">
              Let's Be Honest
            </span>
          </Link>

          {/* Search bar (desktop) */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex-1 max-w-sm">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
                placeholder="Search discussions..."
                className="lb-input text-sm"
              />
            </form>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="lb-btn-ghost p-2"
              aria-label="Search"
            >
              <Search size={15} />
            </button>

            {/* Notification bell — signed-in users only */}
            {!loading && user && (
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => setNotifOpen((v) => !v)}
                  className="lb-btn-ghost p-2 relative"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-fg))] text-[8px] font-bold flex items-center justify-center leading-none tabular-nums">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel
                  open={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  anchorRef={bellRef}
                />
              </div>
            )}

            {/* ── GUEST: show Sign In + Create Account ─────────────────── */}
            {!loading && !displayUser && (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="lb-btn-ghost hidden sm:inline-flex ml-1 text-xs"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="lb-btn-primary ml-1 hidden sm:inline-flex text-xs"
                >
                  Create Account
                </button>
                {/* Mobile: single icon button */}
                <button
                  onClick={() => openAuth("signup")}
                  className="sm:hidden lb-btn-ghost p-2"
                  aria-label="Create Account"
                >
                  <UserCircle size={17} />
                </button>
              </>
            )}

            {/* ── SIGNED IN: Write post + avatar menu ───────────────────── */}
            {!loading && displayUser && (
              <>
                <button
                  onClick={() => navigate("/create")}
                  className="lb-btn-primary ml-1 hidden sm:inline-flex"
                >
                  <PenLine size={14} />
                  Post
                </button>

                {/* Avatar + dropdown */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex-shrink-0 focus:outline-none"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.displayName}
                      className="w-7 h-7 rounded-full object-cover border border-[hsl(var(--border))] hover:opacity-80 transition-opacity"
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-sm shadow-lg overflow-hidden">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
                          <p className="text-xs font-semibold text-[hsl(var(--text-primary))] truncate">
                            {displayUser.displayName}
                          </p>
                          <p className="text-[10px] text-[hsl(var(--text-muted))] truncate">
                            @{displayUser.username}
                          </p>
                        </div>
                        <Link
                          to={`/profile/${displayUser.username}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
                        >
                          <UserCircle size={13} />
                          View Profile
                        </Link>
                        <Link
                          to="/settings/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
                        >
                          <Settings size={13} />
                          Edit Profile
                        </Link>
                        <Link
                          to="/create"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors sm:hidden"
                        >
                          <PenLine size={13} />
                          New Post
                        </Link>
                        <div className="border-t border-[hsl(var(--border))]">
                          <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] transition-colors"
                          >
                            <LogOut size={13} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="ml-1 w-7 h-7 rounded-full bg-[hsl(var(--border))] animate-pulse" />
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
