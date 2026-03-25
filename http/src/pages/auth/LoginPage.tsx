import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useThemeStore } from "@/stores/themeStore";
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineServer,
} from "react-icons/hi";
import { HiLanguage, HiMoon, HiSun } from "react-icons/hi2";
import { useNavigate } from "react-router";
import version from "@/version";

export default function LoginPage() {
  const navigate = useNavigate();
  const { language, languageCode, toggleLanguage } = useLanguageStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(password);
      if (response.success) {
        navigate("/app/dashboard", { replace: true });
      } else {
        setError(response.message || language("Login gagal", "Login failed"));
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : language(
              "Koneksi gagal. Periksa server Anda.",
              "Connection failed. Check your server.",
            );
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      {/* Top bar with toggles */}
      <div className="absolute top-0 right-0 z-20 flex items-center gap-1.5 p-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-dark-300 hover:text-foreground hover:bg-dark-700/50 transition-all text-xs font-mono"
          title={language("Ganti bahasa", "Change language")}
        >
          <HiLanguage className="w-4 h-4" />
          <span className="uppercase">{languageCode}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-dark-300 hover:text-foreground hover:bg-dark-700/50 transition-all"
          title={
            isDarkMode
              ? language("Mode terang", "Light mode")
              : language("Mode gelap", "Dark mode")
          }
        >
          {isDarkMode ? (
            <HiSun className="w-4 h-4" />
          ) : (
            <HiMoon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500/15 border border-accent-500/25 mb-5">
              <HiOutlineServer className="w-8 h-8 text-accent-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Go MQTT Engine
            </h1>
            <p className="text-sm text-dark-300 mt-1.5">
              {language(
                "Masuk untuk mengelola broker MQTT Anda",
                "Sign in to manage your MQTT broker",
              )}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-dark-800/70 backdrop-blur-xl border border-dark-600/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20">
            {error && (
              <div className="bg-neon-red/10 border border-neon-red/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm text-neon-red">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  {language("Kata Sandi", "Password")}
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language(
                      "Masukkan kata sandi",
                      "Enter password",
                    )}
                    className="w-full pl-10 pr-11 py-3 bg-dark-900/60 border border-dark-500/50 rounded-xl text-foreground placeholder-dark-400 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all text-sm"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language("Menghubungkan...", "Connecting...")}</span>
                  </>
                ) : (
                  <span>{language("Masuk", "Sign In")}</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-dark-400 font-mono mt-6">
            Go MQTT Engine {version}
          </p>
        </div>
      </div>
    </div>
  );
}
