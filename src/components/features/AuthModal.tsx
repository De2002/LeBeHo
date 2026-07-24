import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  sendOtp,
  verifyOtpAndSetPassword,
  signInWithPassword,
  mapSupabaseUser,
} from "@/lib/authService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";
type SignupStep = 1 | 2 | 3; // 1=email, 2=otp, 3=username+password

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

export default function AuthModal({
  open,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [step, setStep] = useState<SignupStep>(1);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Fields
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset on open/mode change
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setStep(1);
      setEmail("");
      setOtp(["", "", "", ""]);
      setUsername("");
      setPassword("");
      setLoginPassword("");
      setLoading(false);
      setResetSent(false);
    }
  }, [open, defaultMode]);

  // Lock body scroll
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

  if (!open) return null;

  // ── Sign-up handlers ───────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendOtp(email);
      setStep(2);
      toast.success("Verification code sent — check your inbox.");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (idx: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    if (char && idx < 3) otpRefs[idx + 1].current?.focus();
    if (!char && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(""));
      otpRefs[3].current?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 4) {
      toast.error("Please enter the full 4-digit code.");
      return;
    }
    setStep(3);
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username is required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtpAndSetPassword(
        email,
        otp.join(""),
        password,
        username
      );
      login(mapSupabaseUser(user));
      toast.success("Welcome to LeBeHo!");
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handler ───────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // ── Login handler ──────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !loginPassword) return;
    setLoading(true);
    try {
      const user = await signInWithPassword(email, loginPassword);
      login(mapSupabaseUser(user));
      toast.success("Welcome back!");
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step progress indicator ────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-1.5 mb-6">
      {([1, 2, 3] as SignupStep[]).map((s) => (
        <div
          key={s}
          className={`h-0.5 rounded-full transition-all duration-300 ${
            s === step
              ? "w-8 bg-[hsl(var(--text-primary))]"
              : s < step
              ? "w-4 bg-[hsl(var(--text-primary)/0.4)]"
              : "w-4 bg-[hsl(var(--border))]"
          }`}
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        aria-label={mode === "login" ? "Sign In" : "Create Account"}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative w-full max-w-sm bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-sm pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <div className="px-7 pt-8 pb-7">
            {/* Brand */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-5">
              LeBeHo
            </p>

            {/* ── MODE TABS ─────────────────────────────────────────────── */}
            {mode !== "forgot" && (
              <div className="flex gap-5 border-b border-[hsl(var(--border))] mb-7">
                {(["signup", "login"] as ("signup" | "login")[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setStep(1);
                      setEmail("");
                      setOtp(["", "", "", ""]);
                      setResetSent(false);
                    }}
                    className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors duration-150 ${
                      mode === m
                        ? "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))]"
                        : "border-transparent text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))]"
                    }`}
                  >
                    {m === "signup" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>
            )}

            {/* ── SIGN UP FLOW ───────────────────────────────────────────── */}
            {mode === "signup" && (
              <>
                <StepDots />

                {step === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                        Enter your email
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mb-4 leading-relaxed">
                        We'll send a 4-digit code to verify it's you.
                      </p>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                        className="lb-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="lb-btn-primary w-full justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          Send Code <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                        Check your inbox
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mb-5 leading-relaxed">
                        Enter the 4-digit code sent to{" "}
                        <span className="font-medium text-[hsl(var(--text-secondary))]">
                          {email}
                        </span>
                      </p>

                      {/* OTP boxes */}
                      <div
                        className="flex gap-3 justify-center"
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={otpRefs[i]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpInput(i, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !digit && i > 0) {
                                otpRefs[i - 1].current?.focus();
                              }
                            }}
                            autoFocus={i === 0}
                            className="w-12 h-14 text-center text-xl font-bold border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text-primary))] rounded-sm outline-none focus:border-[hsl(var(--text-primary))] transition-colors tabular-nums"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otp.join("").length < 4}
                      className="lb-btn-primary w-full justify-center disabled:opacity-50"
                    >
                      Verify Code <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    >
                      ← Change email
                    </button>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleCompleteSignup} className="space-y-5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2
                          size={13}
                          className="text-[hsl(142,60%,40%)]"
                        />
                        <p className="text-[11px] text-[hsl(142,60%,40%)] font-medium">
                          Email verified
                        </p>
                      </div>
                      <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-4">
                        Set up your profile
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                            Username
                          </label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                              setUsername(
                                e.target.value
                                  .replace(/\s/g, "")
                                  .toLowerCase()
                                  .slice(0, 30)
                              )
                            }
                            placeholder="yourhandle"
                            required
                            autoFocus
                            className="lb-input"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="At least 6 characters"
                              required
                              minLength={6}
                              className="lb-input pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff size={13} />
                              ) : (
                                <Eye size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        loading || !username.trim() || password.length < 6
                      }
                      className="lb-btn-primary w-full justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Join LeBeHo"
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ── LOGIN FLOW ─────────────────────────────────────────────── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-4">
                    Welcome back
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                        className="lb-input"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode("forgot");
                            setResetSent(false);
                          }}
                          className="text-[10px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Your password"
                          required
                          className="lb-input pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                        >
                          {showLoginPassword ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !loginPassword}
                  className="lb-btn-primary w-full justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      Sign In <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[hsl(var(--text-muted))]">
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-[hsl(var(--text-primary))] font-semibold hover:underline"
                  >
                    Create one free
                  </button>
                </p>
              </form>
            )}

            {/* ── FORGOT PASSWORD FLOW ───────────────────────────────────── */}
            {mode === "forgot" && (
              <div>
                {!resetSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div>
                      <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                        Reset password
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mb-5 leading-relaxed">
                        Enter your account email and we'll send a reset link.
                      </p>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoFocus
                        className="lb-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="lb-btn-primary w-full justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>Send Reset Link <ArrowRight size={14} /></>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="w-full text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    >
                      ← Back to Sign In
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4 space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center">
                        <MailCheck size={22} className="text-[hsl(var(--text-primary))]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-1">
                        Check your inbox
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                        A reset link has been sent to{" "}
                        <span className="font-medium text-[hsl(var(--text-secondary))]">
                          {email}
                        </span>.
                        <br />The link expires in 1 hour.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setResetSent(false);
                        setEmail("");
                      }}
                      className="lb-btn-outline w-full justify-center text-sm"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Terms note */}
            <p className="mt-5 text-[10px] text-[hsl(var(--text-muted))] text-center leading-relaxed">
              By joining you agree to share honest opinions respectfully.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
