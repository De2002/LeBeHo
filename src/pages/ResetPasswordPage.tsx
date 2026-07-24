import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { mapSupabaseUser } from "@/lib/authService";
import { useAuth } from "@/hooks/useAuth";

type PageState = "loading" | "ready" | "success" | "invalid";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Supabase sends the recovery token via URL fragment (#access_token=...&type=recovery)
  // onAuthStateChange fires a PASSWORD_RECOVERY event when it detects this token.
  useEffect(() => {
    let mounted = true;

    // Give onAuthStateChange a moment to process the URL fragment
    const timer = setTimeout(() => {
      if (mounted && pageState === "loading") {
        setPageState("invalid");
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        clearTimeout(timer);
        setPageState("ready");
      }
    });

    // Also check if there's already an active session from the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session && pageState === "loading") {
        // Check URL for recovery type
        const hash = window.location.hash;
        if (hash.includes("type=recovery") || hash.includes("type=email")) {
          clearTimeout(timer);
          setPageState("ready");
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message || "Failed to update password.");
      setSaving(false);
      return;
    }

    if (data.user) {
      login(mapSupabaseUser(data.user));
    }

    setPageState("success");
    setSaving(false);

    setTimeout(() => navigate("/"), 2500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-6 text-center">
          LeBeHo
        </p>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {pageState === "loading" && (
          <div className="text-center py-10">
            <Loader2
              size={22}
              className="animate-spin text-[hsl(var(--text-muted))] mx-auto mb-3"
            />
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Verifying reset link…
            </p>
          </div>
        )}

        {/* ── Invalid / expired ──────────────────────────────────────── */}
        {pageState === "invalid" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center mx-auto">
              <AlertCircle size={22} className="text-[hsl(0,72%,50%)]" />
            </div>
            <div>
              <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                Link expired or invalid
              </p>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                This reset link has expired or already been used. Request a new
                one from the sign-in screen.
              </p>
            </div>
            <Link to="/" className="lb-btn-primary inline-flex w-full justify-center">
              Back to LeBeHo
            </Link>
          </div>
        )}

        {/* ── Ready — new password form ──────────────────────────────── */}
        {pageState === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-xl font-extrabold text-[hsl(var(--text-primary))] mb-1">
                Set new password
              </p>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                Choose a strong password for your account.
              </p>
            </div>

            <div className="space-y-5">
              {/* New password */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    className="lb-input pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3].map((level) => {
                      const strength =
                        password.length >= 12
                          ? 3
                          : password.length >= 8
                          ? 2
                          : 1;
                      const colors = ["#DC2626", "#CA8A04", "#16A34A"];
                      return (
                        <div
                          key={level}
                          className="flex-1 h-0.5 rounded-full transition-colors duration-300"
                          style={{
                            backgroundColor:
                              level <= strength
                                ? colors[strength - 1]
                                : "hsl(var(--border))",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="lb-input pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {confirm.length > 0 && (
                  <p
                    className={`text-[10px] mt-1 transition-colors ${
                      password === confirm
                        ? "text-[hsl(142,60%,40%)]"
                        : "text-[hsl(0,72%,50%)]"
                    }`}
                  >
                    {password === confirm ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                password.length < 6 ||
                password !== confirm
              }
              className="lb-btn-primary w-full justify-center disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}

        {/* ── Success ────────────────────────────────────────────────── */}
        {pageState === "success" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center mx-auto">
              <CheckCircle2 size={22} className="text-[hsl(142,60%,40%)]" />
            </div>
            <div>
              <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                Password updated
              </p>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                You're signed in. Redirecting you to the feed…
              </p>
            </div>
            <div className="h-0.5 bg-[hsl(var(--border))] rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--text-primary))] rounded-full"
                style={{ animation: "progressBar 2.5s linear forwards" }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
