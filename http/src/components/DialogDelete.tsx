import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguageStore } from "@/stores/languageStore";

interface DialogDeleteProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DialogDelete({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: DialogDeleteProps) {
  const { language } = useLanguageStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-dark-300 hover:text-foreground border border-dark-600/50 hover:border-dark-500/60 rounded-xl transition-all"
          >
            {language("Batal", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 bg-neon-red/80 hover:bg-neon-red disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {language("Hapus", "Delete")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
