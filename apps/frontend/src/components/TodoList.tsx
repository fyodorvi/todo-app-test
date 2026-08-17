import type { Todo } from "@/api/todos";
import { TodoItem, type TodoListVariant } from "@/components/TodoItem";
import { formatLegDistance } from "@/lib/geo";

type TodoListProps = {
  todos: Todo[];
  variant: TodoListVariant;
  loading?: boolean;
  emptyMessage?: string;
  stopNumbers?: number[];
  legDistances?: number[];
  onSchedule?: (id: string) => void;
  onUnschedule?: (id: string) => void;
  onMarkDone?: (id: string) => void;
  onUndoDone?: (id: string) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
};

export function TodoList({
  todos,
  variant,
  loading,
  emptyMessage,
  stopNumbers,
  legDistances,
  onSchedule,
  onUnschedule,
  onMarkDone,
  onUndoDone,
  onDelete,
  busy,
}: TodoListProps) {
  if (loading) {
    return null;
  }

  if (todos.length === 0) {
    if (emptyMessage) {
      return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
    }
    return null;
  }

  return (
    <div className="space-y-2">
      {todos.map((todo, index) => (
        <div key={todo.id} className="space-y-2">
          <TodoItem
            todo={todo}
            variant={variant}
            stopNumber={stopNumbers?.[index]}
            onSchedule={onSchedule}
            onUnschedule={onUnschedule}
            onMarkDone={onMarkDone}
            onUndoDone={onUndoDone}
            onDelete={onDelete}
            disabled={busy}
          />
          {legDistances?.[index] !== undefined && (
            <div
              className="flex flex-col items-center gap-1 py-0.5 text-xs text-muted-foreground"
              aria-label={`${formatLegDistance(legDistances[index]!)} to next stop`}
            >
              <span aria-hidden="true">|</span>
              <span>{formatLegDistance(legDistances[index]!)}</span>
              <span aria-hidden="true">|</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
