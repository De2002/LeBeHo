import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import CreateFAB from "@/components/features/CreateFAB";
import FeedPage from "@/pages/FeedPage";
import PostPage from "@/pages/PostPage";
import CreatePostPage from "@/pages/CreatePostPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import StatsPage from "@/pages/StatsPage";
import EditPostPage from "@/pages/EditPostPage";
import NotFound from "@/pages/NotFound";

function AppShell() {
  useTheme();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Header />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings/profile" element={<SettingsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/edit/:id" element={<EditPostPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CreateFAB />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "14px",
            borderRadius: "2px",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
