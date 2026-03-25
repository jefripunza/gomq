import { useState, useEffect, useCallback } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from "react-icons/hi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  topicService,
  type Topic,
  type TopicType,
} from "@/services/topic.service";
import { userService, type User } from "@/services/user.service";
import { useLanguageStore } from "@/stores/languageStore";
import { formatDate } from "@/utils/datetime";

const TOPIC_TYPES: { value: TopicType; labelId: string; labelEn: string }[] = [
  {
    value: "pub_to_sub",
    labelId: "Publish to Subscribe",
    labelEn: "Publish to Subscribe",
  },
  { value: "pub_to_api", labelId: "Publish to API", labelEn: "Publish to API" },
  {
    value: "api_to_sub",
    labelId: "API to Subscribe",
    labelEn: "API to Subscribe",
  },
];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function parseOrigins(origins?: string | null): string[] {
  if (!origins) return [];
  try {
    const parsed = JSON.parse(origins);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const inputClass =
  "w-full px-4 py-2.5 bg-dark-900/60 border border-dark-500/50 rounded-xl text-foreground placeholder-dark-400 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all text-sm";

export default function TopicPage() {
  const { language } = useLanguageStore();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  // Form state
  const [formType, setFormType] = useState<TopicType | "">("");
  const [formName, setFormName] = useState("");
  const [formMethod, setFormMethod] = useState("POST");
  const [formUrl, setFormUrl] = useState("");
  const [formOrigins, setFormOrigins] = useState<string[]>([]);
  const [originInput, setOriginInput] = useState("");
  const [formUserId, setFormUserId] = useState("");

  // Users for dropdown
  const [users, setUsers] = useState<User[]>([]);

  const resetForm = () => {
    setFormType("");
    setFormName("");
    setFormMethod("POST");
    setFormUrl("");
    setFormOrigins([]);
    setOriginInput("");
    setFormUserId("");
  };

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await topicService.getAll();
      setTopics(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userService.getAll();
      setUsers(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
    fetchUsers();
  }, [fetchTopics, fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formType) return;
    setIsSaving(true);
    try {
      await topicService.create({
        type: formType,
        name: formName.trim(),
        ...(formType === "pub_to_api" && {
          method: formMethod,
          url: formUrl.trim(),
        }),
        ...(formType === "api_to_sub" && {
          origins: formOrigins,
        }),
        ...(formUserId && { user_id: formUserId }),
      });
      resetForm();
      setIsAddOpen(false);
      fetchTopics();
    } catch (err) {
      console.error("Failed to create topic:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    try {
      await topicService.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchTopics();
    } catch (err) {
      console.error("Failed to remove topic:", err);
    }
  };

  const addOrigin = () => {
    const val = originInput.trim();
    if (val && !formOrigins.includes(val)) {
      setFormOrigins([...formOrigins, val]);
    }
    setOriginInput("");
  };

  const removeOrigin = (idx: number) => {
    setFormOrigins(formOrigins.filter((_, i) => i !== idx));
  };

  const typeLabel = (type: TopicType) => {
    const found = TOPIC_TYPES.find((t) => t.value === type);
    return found ? language(found.labelId, found.labelEn) : type;
  };

  const typeBadgeClass = (type: TopicType) => {
    switch (type) {
      case "pub_to_sub":
        return "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20";
      case "pub_to_api":
        return "text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20";
      case "api_to_sub":
        return "text-accent-400 bg-accent-500/10 border-accent-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {language("Manajemen Topik", "Topic Management")}
          </h2>
          <p className="text-sm text-dark-300 mt-1">
            {language(
              "Kelola topik MQTT untuk publish/subscribe",
              "Manage MQTT topics for publish/subscribe",
            )}
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(o) => {
            setIsAddOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent-500/25 shrink-0">
              <HiOutlinePlus className="w-4 h-4" />
              <span>{language("Tambah Topik", "Add Topic")}</span>
            </button>
          </DialogTrigger>
          <DialogContent
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {language("Tambah Topik Baru", "Add New Topic")}
              </DialogTitle>
              <DialogDescription>
                {language(
                  "Pilih tipe topik lalu isi detail yang diperlukan.",
                  "Choose a topic type then fill in the required details.",
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              {/* Type dropdown */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  {language("Tipe Topik", "Topic Type")}
                  <span className="text-neon-red ml-1">*</span>
                </label>
                <select
                  value={formType}
                  onChange={(e) => {
                    setFormType(e.target.value as TopicType | "");
                    setFormName("");
                    setFormMethod("POST");
                    setFormUrl("");
                    setFormOrigins([]);
                    setOriginInput("");
                  }}
                  className={inputClass}
                  required
                >
                  <option value="">
                    {language("-- Pilih tipe --", "-- Select type --")}
                  </option>
                  {TOPIC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {language(t.labelId, t.labelEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fields shown after type is selected */}
              {formType && (
                <>
                  {/* Topic Name */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">
                      {language("Nama Topik", "Topic Name")}
                      <span className="text-neon-red ml-1">*</span>
                    </label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={language(
                        "contoh: sensor/suhu",
                        "e.g. sensor/temperature",
                      )}
                      className={`${inputClass} font-mono`}
                      required
                    />
                  </div>

                  {/* User credential (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">
                      {language("Kredensial Pengguna", "User Credential")}
                      <span className="text-dark-400 text-xs ml-1">
                        ({language("opsional", "optional")})
                      </span>
                    </label>
                    <select
                      value={formUserId}
                      onChange={(e) => setFormUserId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">
                        {language(
                          "-- Tanpa kredensial --",
                          "-- No credential --",
                        )}
                      </option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.title} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Publish to API: method + url */}
                  {formType === "pub_to_api" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-1.5">
                          {language("Metode HTTP", "HTTP Method")}
                          <span className="text-neon-red ml-1">*</span>
                        </label>
                        <select
                          value={formMethod}
                          onChange={(e) => setFormMethod(e.target.value)}
                          className={inputClass}
                          required
                        >
                          {HTTP_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-200 mb-1.5">
                          URL
                          <span className="text-neon-red ml-1">*</span>
                        </label>
                        <input
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          placeholder="https://api.example.com/webhook"
                          className={`${inputClass} font-mono`}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* API to Subscribe: whitelist origins */}
                  {formType === "api_to_sub" && (
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-1.5">
                        {language("Whitelist Origin", "Whitelist Origins")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={originInput}
                          onChange={(e) => setOriginInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOrigin();
                            }
                          }}
                          placeholder={language(
                            "contoh: https://app.example.com",
                            "e.g. https://app.example.com",
                          )}
                          className={`${inputClass} font-mono flex-1`}
                        />
                        <button
                          type="button"
                          onClick={addOrigin}
                          className="px-3 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-all shrink-0"
                        >
                          <HiOutlinePlus className="w-4 h-4" />
                        </button>
                      </div>
                      {formOrigins.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {formOrigins.map((origin, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 bg-dark-700/40 border border-dark-600/30 rounded-lg"
                            >
                              <span className="flex-1 text-sm font-mono text-foreground truncate">
                                {origin}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeOrigin(idx)}
                                className="text-dark-400 hover:text-neon-red transition-colors shrink-0"
                              >
                                <HiOutlineX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <DialogFooter className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-dark-300 hover:text-foreground border border-dark-600/50 hover:border-dark-500/60 rounded-xl transition-all"
                >
                  {language("Batal", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formType}
                  className="px-6 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent-500/25"
                >
                  {isSaving
                    ? language("Menyimpan...", "Saving...")
                    : language("Tambah", "Add")}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topic list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-dark-400/30 border-t-dark-300 rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-sm text-dark-300 font-mono bg-dark-800/40 border border-dark-600/30 rounded-xl p-8 text-center">
            {language(
              "Belum ada topik. Tambahkan topik pertama Anda.",
              "No topics yet. Add your first topic.",
            )}
          </div>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-dark-800/60 border border-dark-600/40 rounded-xl p-4 hover:border-dark-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Type badge + name */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${typeBadgeClass(topic.type)}`}
                    >
                      {typeLabel(topic.type)}
                    </span>
                    <span className="font-mono font-semibold text-foreground text-sm truncate">
                      {topic.name}
                    </span>
                    {topic.user_id &&
                      (() => {
                        const u = users.find((u) => u.id === topic.user_id);
                        return u ? (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border text-dark-200 bg-dark-700/40 border-dark-600/30">
                            @{u.username}
                          </span>
                        ) : null;
                      })()}
                  </div>

                  {/* Extra info per type */}
                  {topic.type === "pub_to_api" && topic.method && topic.url && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-neon-yellow bg-neon-yellow/10 border border-neon-yellow/20 px-2 py-0.5 rounded-md">
                        {topic.method}
                      </span>
                      <span className="font-mono text-dark-300 truncate">
                        {topic.url}
                      </span>
                    </div>
                  )}

                  {topic.type === "api_to_sub" && topic.origins && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {parseOrigins(topic.origins).map((origin, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-dark-700/40 border border-dark-600/30 text-dark-200"
                        >
                          {origin}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Created at */}
                  <p className="text-xs text-dark-400 font-mono mt-2">
                    {formatDate(topic.created_at)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(topic)}
                  className="p-2 rounded-lg text-dark-400 hover:text-neon-red hover:bg-neon-red/5 transition-all shrink-0"
                  title={language("Hapus", "Delete")}
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {language("Hapus topik?", "Delete topic?")}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? language(
                    `Ini akan menghapus topik "${deleteTarget.name}" secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                    `This will permanently delete the topic "${deleteTarget.name}". This action cannot be undone.`,
                  )
                : language(
                    "Tindakan ini tidak dapat dibatalkan.",
                    "This action cannot be undone.",
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-5 py-2.5 text-sm font-semibold text-dark-300 hover:text-foreground border border-dark-600/50 hover:border-dark-500/60 rounded-xl transition-all"
            >
              {language("Batal", "Cancel")}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-6 py-2.5 bg-neon-red/80 hover:bg-neon-red disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {language("Hapus", "Delete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
