import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Camera,
  Loader2,
  Check,
  ArrowLeft,
  UserCircle,
  FileText,
  Tag,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { mapSupabaseUser } from "@/lib/authService";
import {
  fetchProfile,
  saveProfile,
  uploadAvatar,
  type ProfileData,
} from "@/lib/profileService";
import { CATEGORIES } from "@/constants";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

type SettingsSection = "profile" | "topics" | "appearance";

export default function SettingsPage() {
  const { user, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [section, setSection] = useState<SettingsSection>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [topics, setTopics] = useState<Category[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    fetchProfile(user.id)
      .then((profile) => {
        if (profile) {
          setDisplayName(profile.display_name || user.displayName || "");
          setUsername(profile.username || user.username || "");
          setBio(profile.bio || "");
          setAvatarUrl(profile.avatar_url || user.avatar || "");
          setAvatarPreview(profile.avatar_url || user.avatar || "");
          setTopics((profile.topics as Category[]) || []);
        } else {
          // No profile row yet — seed from auth metadata
          setDisplayName(user.displayName || "");
          setUsername(user.username || "");
          setAvatarUrl(user.avatar || "");
          setAvatarPreview(user.avatar || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile data.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const processFile = useCallback(
    async (file: File) => {
      if (!user) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB.");
        return;
      }

      // Optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setAvatarUploading(true);

      try {
        const url = await uploadAvatar(user.id, file);
        setAvatarUrl(url);
        setAvatarPreview(url);
        toast.success("Avatar uploaded.");
      } catch (err: unknown) {
        const msg = (err as Error).message || "Unknown error";
        console.error("Avatar upload failed:", msg);
        toast.error(`Avatar upload failed: ${msg}`);
        setAvatarPreview(avatarUrl); // revert
      } finally {
        setAvatarUploading(false);
      }
    },
    [user, avatarUrl]
  );

  // Drag-and-drop on avatar zone
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const toggleTopic = (id: Category) => {
    setTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    if (!username.trim()) {
      toast.error("Username is required.");
      return;
    }

    setSaving(true);
    const updates: Partial<ProfileData> = {
      display_name: displayName.trim(),
      username: username.trim().toLowerCase().replace(/\s/g, ""),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      topics,
    };

    try {
      await saveProfile(user.id, updates);

      // Refresh auth session to pick up updated metadata
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        login(mapSupabaseUser(data.user));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Profile saved.");
    } catch (err: unknown) {
      console.error("Save failed:", err);
      toast.error((err as Error).message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  // ── Sections nav ──────────────────────────────────────────────────────
  const NAV: { id: SettingsSection; label: string; icon: typeof UserCircle }[] = [
    { id: "profile", label: "Profile", icon: UserCircle },
    { id: "topics", label: "Topics", icon: Tag },
    { id: "appearance", label: "Appearance", icon: Moon },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        to={`/profile/${user.username}`}
        className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors mb-6"
      >
        <ArrowLeft size={12} />
        Back to profile
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-1">
            LeBeHo
          </p>
          <h1 className="text-2xl font-extrabold text-[hsl(var(--text-primary))]">
            Settings
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Sidebar nav — desktop only */}
        <aside className="hidden sm:block w-36 flex-shrink-0">
          <nav className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-sm transition-colors text-left ${
                  section === id
                    ? "bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] font-semibold"
                    : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content — tabs live inside here on mobile */}
        <div className="flex-1 min-w-0">
          {/* Mobile section tabs */}
          <div className="sm:hidden mb-6">
            <div className="flex gap-0 border border-[hsl(var(--border))] rounded-sm overflow-hidden">
              {NAV.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    section === id
                      ? "bg-[hsl(var(--text-primary))] text-[hsl(var(--background))]"
                      : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* ── PROFILE SECTION ───────────────────────────────────── */}
              {section === "profile" && (
                <div className="space-y-8">
                  {/* Avatar */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-4 flex items-center gap-2">
                      <Camera size={11} />
                      Profile Picture
                    </p>

                    <div className="flex items-start gap-5">
                      {/* Avatar preview */}
                      <div className="relative flex-shrink-0">
                        <div
                          ref={dragRef}
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative w-20 h-20 rounded-full border-2 cursor-pointer transition-colors overflow-hidden group ${
                            dragging
                              ? "border-[hsl(var(--text-primary))]"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--text-primary))]"
                          }`}
                          title="Click or drop to change avatar"
                        >
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[hsl(var(--surface))] flex items-center justify-center">
                              <UserCircle
                                size={32}
                                className="text-[hsl(var(--text-muted))]"
                              />
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {avatarUploading ? (
                              <Loader2
                                size={16}
                                className="text-white animate-spin"
                              />
                            ) : (
                              <Camera size={16} className="text-white" />
                            )}
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processFile(file);
                          }}
                        />
                      </div>

                      {/* Upload instructions */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="lb-btn-outline text-xs"
                          disabled={avatarUploading}
                        >
                          {avatarUploading ? (
                            <>
                              <Loader2 size={11} className="animate-spin" />
                              Uploading…
                            </>
                          ) : (
                            "Upload Image"
                          )}
                        </button>
                        <p className="text-[11px] text-[hsl(var(--text-muted))] mt-2 leading-relaxed">
                          JPG, PNG, GIF up to 5 MB.
                          <br />
                          Drag & drop onto the circle.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[hsl(var(--border-subtle))]" />

                  {/* Identity fields */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-5 flex items-center gap-2">
                      <UserCircle size={11} />
                      Identity
                    </p>

                    <div className="space-y-6">
                      {/* Display name */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) =>
                            setDisplayName(e.target.value.slice(0, 50))
                          }
                          placeholder="Your full name or handle"
                          className="lb-input"
                          required
                        />
                        <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1">
                          {displayName.length}/50 · Shown on your posts and profile.
                        </p>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-1.5">
                          Username
                        </label>
                        <div className="flex items-center border-b border-[hsl(var(--border))] focus-within:border-[hsl(var(--text-primary))] transition-colors">
                          <span className="text-sm text-[hsl(var(--text-muted))] pb-2 pr-0.5 select-none">
                            @
                          </span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                              setUsername(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, "")
                                  .slice(0, 30)
                              )
                            }
                            placeholder="yourhandle"
                            className="flex-1 bg-transparent text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] py-2 text-sm outline-none"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1">
                          Lowercase letters, numbers, underscores. {username.length}/30
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[hsl(var(--border-subtle))]" />

                  {/* Bio */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-5 flex items-center gap-2">
                      <FileText size={11} />
                      Bio
                    </p>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 200))}
                      placeholder="A short description of who you are and what you care about…"
                      rows={3}
                      className="lb-textarea"
                    />
                    <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1">
                      {bio.length}/200
                    </p>
                  </div>
                </div>
              )}

              {/* ── APPEARANCE SECTION ───────────────────────────────── */}
              {section === "appearance" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-1 flex items-center gap-2">
                    <Moon size={11} />
                    Appearance
                  </p>
                  <p className="text-sm text-[hsl(var(--text-secondary))] mb-8 leading-relaxed">
                    Choose how LeBeHo looks for you.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: "light", label: "Light", icon: Sun, desc: "Clean white" },
                      { id: "dark", label: "Dark", icon: Moon, desc: "Easy on eyes" },
                      { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                    ] as { id: "light" | "dark" | "system"; label: string; icon: typeof Sun; desc: string }[]).map(
                      ({ id, label, icon: Icon, desc }) => {
                        const active = theme === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            className={`flex flex-col items-center gap-2.5 px-3 py-4 rounded-sm border transition-all duration-150 ${
                              active
                                ? "border-[hsl(var(--text-primary))] bg-[hsl(var(--surface))]"
                                : "border-[hsl(var(--border))] hover:border-[hsl(var(--text-secondary))]"
                            }`}
                          >
                            <Icon
                              size={18}
                              className={active ? "text-[hsl(var(--text-primary))]" : "text-[hsl(var(--text-muted))]"}
                            />
                            <div className="text-center">
                              <p className={`text-xs font-semibold ${
                                active ? "text-[hsl(var(--text-primary))]" : "text-[hsl(var(--text-secondary))]"
                              }`}>
                                {label}
                              </p>
                              <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">{desc}</p>
                            </div>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--text-primary))]" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* ── TOPICS SECTION ────────────────────────────────────── */}
              {section === "topics" && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-1 flex items-center gap-2">
                    <Tag size={11} />
                    Topic Interests
                  </p>
                  <p className="text-sm text-[hsl(var(--text-secondary))] mb-6 leading-relaxed">
                    Choose the topics you care about. They appear on your
                    profile and help personalise your Following feed.
                  </p>

                  {topics.length === 0 && (
                    <div className="flex items-center gap-2 mb-5 text-xs text-[hsl(var(--text-muted))] border border-dashed border-[hsl(var(--border))] rounded-sm px-3 py-2.5">
                      <AlertCircle size={12} />
                      Select at least one topic to personalise your feed.
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const active = topics.includes(cat.id as Category);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleTopic(cat.id as Category)}
                          className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-sm border text-left transition-all duration-150 ${
                            active
                              ? "border-current"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--text-secondary))]"
                          }`}
                          style={active ? { color: cat.color, borderColor: cat.color } : {}}
                        >
                          {/* Color dot */}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color, opacity: active ? 1 : 0.35 }}
                          />
                          <span
                            className={`text-sm font-medium ${
                              active
                                ? "text-[hsl(var(--text-primary))]"
                                : "text-[hsl(var(--text-secondary))]"
                            }`}
                          >
                            {cat.label}
                          </span>
                          {active && (
                            <Check
                              size={11}
                              className="ml-auto flex-shrink-0"
                              style={{ color: cat.color }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[hsl(var(--text-muted))] mt-4">
                    {topics.length} topic{topics.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              )}

              {/* Save button — always visible */}
              <div className="mt-8 pt-5 border-t border-[hsl(var(--border-subtle))] flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || avatarUploading}
                  className="lb-btn-primary disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving…
                    </>
                  ) : saved ? (
                    <>
                      <Check size={13} />
                      Saved
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <Link
                  to={`/profile/${user.username}`}
                  className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
