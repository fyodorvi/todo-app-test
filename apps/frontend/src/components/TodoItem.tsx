import { Check, MoreHorizontal, Trash2 } from "lucide-react";
import type { Todo } from "@/api/todos";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDisplayAddress } from "@/lib/formatShortAddress";
import { cn } from "@/lib/utils";

export type TodoListVariant = "todo" | "scheduled" | "done";

type TodoItemProps = {
  todo: Todo;
  variant: TodoListVariant;
  stopNumber?: number;
  onSchedule?: (id: string) => void;
  onUnschedule?: (id: string) => void;
  onMarkDone?: (id: string) => void;
  onUndoDone?: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

function StatusCircle({
  variant,
  todoId,
  onMarkDone,
  onUndoDone,
  disabled,
}: {
  variant: TodoListVariant;
  todoId: string;
  onMarkDone?: (id: string) => void;
  onUndoDone?: (id: string) => void;
  disabled?: boolean;
}) {
  if (variant === "todo") {
    return (
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 opacity-40"
        aria-hidden="true"
      />
    );
  }

  if (variant === "scheduled") {
    return (
      <button
        type="button"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        onClick={() => onMarkDone?.(todoId)}
        disabled={disabled}
        aria-label="Mark done"
      />
    );
  }

  return (
    <button
      type="button"
      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
      onClick={() => onUndoDone?.(todoId)}
      disabled={disabled}
      aria-label="Undo done"
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}

export function TodoItem({
  todo,
  variant,
  stopNumber,
  onSchedule,
  onUnschedule,
  onMarkDone,
  onUndoDone,
  onDelete,
  disabled,
}: TodoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <StatusCircle
        variant={variant}
        todoId={todo.id}
        onMarkDone={onMarkDone}
        onUndoDone={onUndoDone}
        disabled={disabled}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "font-medium leading-snug",
            variant === "done" && "text-muted-foreground line-through",
          )}
        >
          {variant === "scheduled" && stopNumber !== undefined && (
            <span className="mr-1.5 text-muted-foreground">{stopNumber} ·</span>
          )}
          {todo.title}
        </p>
        <p className="text-sm text-muted-foreground">{getDisplayAddress(todo.location)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {variant === "todo" && onSchedule && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSchedule(todo.id)}
            disabled={disabled}
          >
            Schedule
          </Button>
        )}

        {variant === "scheduled" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`Actions for ${todo.title}`}
              >
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onUnschedule && (
                <DropdownMenuItem onClick={() => onUnschedule(todo.id)}>
                  Unschedule
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(todo.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {(variant === "todo" || variant === "done") && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(todo.id)}
            disabled={disabled}
            aria-label={`Delete ${todo.title}`}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
