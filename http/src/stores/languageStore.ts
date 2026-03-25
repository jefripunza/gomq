import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LanguageCode = "id" | "en";

interface LanguageState {
  languageCode: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  toggleLanguage: () => void;
  language: (idText: string, enText: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      languageCode: "id",
      setLanguage: (code) => set({ languageCode: code }),
      toggleLanguage: () =>
        set((state) => ({
          languageCode: state.languageCode === "id" ? "en" : "id",
        })),
      language: (idText, enText) =>
        get().languageCode === "id" ? idText : enText,
    }),
    {
      name: "ketring-language",
    },
  ),
);
