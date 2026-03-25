import { useState, useEffect, useCallback } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { userService, type User } from "@/services/user.service";
import { useLanguageStore } from "@/stores/languageStore";
import { formatDate } from "@/utils/datetime";

const inputClass =
  "w-full px-4 py-2.5 bg-dark-900/60 border border-dark-500/50 rounded-xl text-foreground placeholder-dark-400 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all text-sm";

export default function UserPage() {
  const { language } = useLanguageStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormUsername("");
    setFormPassword("");
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userService.create({
        title: formTitle.trim(),
        username: formUsername.trim(),
        password: formPassword,
      });
      resetForm();
      setIsAddOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    try {
      await userService.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to remove user:", err);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {language("Manajemen Pengguna", "User Management")}
          </h2>
          <p className="text-sm text-dark-300 mt-1">
            {language(
              "Kelola kredensial akses untuk topik MQTT",
              "Manage access credentials for MQTT topics",
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
              <span>{language("Tambah Pengguna", "Add User")}</span>
            </button>
          </DialogTrigger>
          <DialogContent
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {language("Tambah Pengguna Baru", "Add New User")}
              </DialogTitle>
              <DialogDescription>
                {language(
                  "Buat kredensial akses baru untuk topik MQTT.",
                  "Create new access credentials for MQTT topics.",
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  {language("Judul", "Title")}
                  <span className="text-neon-red ml-1">*</span>
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={language(
                    "contoh: Sensor Gateway",
                    "e.g. Sensor Gateway",
                  )}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Username
                  <span className="text-neon-red ml-1">*</span>
                </label>
                <input
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder={language(
                    "contoh: sensor_gw_01",
                    "e.g. sensor_gw_01",
                  )}
                  className={`${inputClass} font-mono`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Password
                  <span className="text-neon-red ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} font-mono`}
                  required
                />
              </div>
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
                  disabled={isSaving}
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

      {/* User list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-dark-400/30 border-t-dark-300 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm text-dark-300 font-mono bg-dark-800/40 border border-dark-600/30 rounded-xl p-8 text-center">
            {language(
              "Belum ada pengguna. Tambahkan pengguna pertama Anda.",
              "No users yet. Add your first user.",
            )}
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-dark-800/60 border border-dark-600/40 rounded-xl p-4 hover:border-dark-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {user.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-dark-400 w-16 shrink-0">
                        Username
                      </span>
                      <span className="font-mono text-dark-200">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-dark-400 w-16 shrink-0">
                        Password
                      </span>
                      <span className="font-mono text-dark-200">
                        {visiblePasswords.has(user.id)
                          ? user.password
                          : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-dark-400 hover:text-foreground transition-colors"
                      >
                        {visiblePasswords.has(user.id) ? (
                          <HiOutlineEyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <HiOutlineEye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400 font-mono mt-2">
                    {formatDate(user.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(user)}
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
              {language("Hapus pengguna?", "Delete user?")}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? language(
                    `Ini akan menghapus pengguna "${deleteTarget.title}" secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                    `This will permanently delete the user "${deleteTarget.title}". This action cannot be undone.`,
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
