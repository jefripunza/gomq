import { useState, useEffect, useCallback } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePencil,
  HiClipboardCopy,
  HiCheck,
} from "react-icons/hi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DialogDelete from "@/components/DialogDelete";
import { userService, type User } from "@/services/user.service";
import { useLanguageStore } from "@/stores/languageStore";
import { formatDate } from "@/utils/datetime";

const inputClass =
  "w-full px-4 py-2.5 bg-dark-900/60 border border-dark-500/50 rounded-xl text-foreground placeholder-dark-400 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all text-sm";

export default function UserPage() {
  const { language } = useLanguageStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state (shared for add/edit)
  const [formTitle, setFormTitle] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const isEditMode = editTarget !== null;

  const resetForm = () => {
    setFormTitle("");
    setFormUsername("");
    setFormPassword("");
    setEditTarget(null);
  };

  const openAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    setFormTitle(user.title);
    setFormUsername(user.username);
    setFormPassword("");
    setIsFormOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditMode) {
        await userService.update(editTarget.id, {
          title: formTitle.trim(),
          username: formUsername.trim(),
          ...(formPassword && { password: formPassword }),
        });
      } else {
        await userService.create({
          title: formTitle.trim(),
          username: formUsername.trim(),
          password: formPassword,
        });
      }
      resetForm();
      setIsFormOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
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

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1200);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-accent-500/25 shrink-0"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>{language("Tambah Pengguna", "Add User")}</span>
        </button>
      </div>

      {/* User list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-dark-400/30 border-t-dark-300 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="col-span-full text-sm text-dark-300 font-mono bg-dark-800/40 border border-dark-600/30 rounded-xl p-8 text-center">
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
                      <span className="text-dark-400 w-24 shrink-0">
                        {language("Nama Pengguna", "Username")}
                      </span>
                      <span className="font-mono text-dark-200">
                        {user.username}
                      </span>
                      <button
                        onClick={() =>
                          copyText(user.username, `${user.id}-username`)
                        }
                        className="text-dark-400 hover:text-foreground transition-colors"
                        title={language("Salin username", "Copy username")}
                      >
                        {copiedKey === `${user.id}-username` ? (
                          <HiCheck className="w-4 h-4 text-neon-green" />
                        ) : (
                          <HiClipboardCopy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-dark-400 w-24 shrink-0">
                        {language("Kata Sandi", "Password")}
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
                      <button
                        onClick={() =>
                          copyText(user.password, `${user.id}-password`)
                        }
                        className="text-dark-400 hover:text-foreground transition-colors"
                        title={language("Salin password", "Copy password")}
                      >
                        {copiedKey === `${user.id}-password` ? (
                          <HiCheck className="w-4 h-4 text-neon-green" />
                        ) : (
                          <HiClipboardCopy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(user)}
                    className="p-2 rounded-lg text-dark-400 hover:text-accent-400 hover:bg-accent-500/5 transition-all"
                    title={language("Edit", "Edit")}
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="p-2 rounded-lg text-dark-400 hover:text-neon-red hover:bg-neon-red/5 transition-all"
                    title={language("Hapus", "Delete")}
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(o) => {
          setIsFormOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? language("Edit Pengguna", "Edit User")
                : language("Tambah Pengguna Baru", "Add New User")}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? language(
                    "Ubah kredensial pengguna. Kosongkan password jika tidak ingin mengubahnya.",
                    "Update user credentials. Leave password empty to keep it unchanged.",
                  )
                : language(
                    "Buat kredensial akses baru untuk topik MQTT.",
                    "Create new access credentials for MQTT topics.",
                  )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                {isEditMode ? (
                  <span className="text-dark-400 text-xs ml-1">
                    (
                    {language(
                      "kosongkan jika tidak diubah",
                      "leave empty to keep",
                    )}
                    )
                  </span>
                ) : (
                  <span className="text-neon-red ml-1">*</span>
                )}
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} font-mono`}
                required={!isEditMode}
              />
            </div>
            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
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
                  : isEditMode
                    ? language("Simpan", "Save")
                    : language("Tambah", "Add")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <DialogDelete
        open={!!deleteTarget}
        title={language("Hapus pengguna?", "Delete user?")}
        description={
          deleteTarget
            ? language(
                `Ini akan menghapus pengguna "${deleteTarget.title}" secara permanen. Tindakan ini tidak dapat dibatalkan.`,
                `This will permanently delete the user "${deleteTarget.title}". This action cannot be undone.`,
              )
            : language(
                "Tindakan ini tidak dapat dibatalkan.",
                "This action cannot be undone.",
              )
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
}
