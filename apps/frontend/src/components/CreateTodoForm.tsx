import { useEffect, useState } from "react";
import type { CreateTodoInput, TodoLocation } from "@/api/todos";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateTodoFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSubmit: (input: CreateTodoInput) => Promise<void>;
  disabled?: boolean;
};

export function CreateTodoForm({
  open,
  onOpenChange,
  date,
  onSubmit,
  disabled,
}: CreateTodoFormProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState<TodoLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setLocation(null);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!location) {
      setError("Select an address from the list");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ title, location, state: "todo", date });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = disabled || submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add todo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mow lawn"
              required
              disabled={isDisabled}
            />
          </div>

          <AddressAutocomplete
            key={open ? "open" : "closed"}
            value={location}
            onChange={setLocation}
            disabled={isDisabled}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDisabled}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled || !location}>
              {submitting ? "Adding..." : "Add todo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
