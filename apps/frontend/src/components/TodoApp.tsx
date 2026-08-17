import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  updateTodo,
  type CreateTodoInput,
  type Todo,
} from "@/api/todos";
import { CreateTodoForm } from "@/components/CreateTodoForm";
import { TodoList } from "@/components/TodoList";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDisplayDate } from "@/lib/todo-utils";
import { haversineMeters } from "@/lib/geo";
import { greedyRouteOrder } from "@/lib/optimizeRoute";

type ScheduledRoute = {
  order: string[];
  stopNumbers: Record<string, number>;
};

function buildScheduledRoutes(todos: Todo[]): Record<string, ScheduledRoute> {
  const scheduledByDate = new Map<string, Todo[]>();

  for (const todo of todos) {
    if (todo.state !== "scheduled") {
      continue;
    }

    const scheduled = scheduledByDate.get(todo.date) ?? [];
    scheduled.push(todo);
    scheduledByDate.set(todo.date, scheduled);
  }

  const routes: Record<string, ScheduledRoute> = {};
  for (const [date, scheduled] of scheduledByDate) {
    const order = greedyRouteOrder(scheduled);
    const stopNumbers = Object.fromEntries(order.map((id, index) => [id, index + 1]));
    routes[date] = { order, stopNumbers };
  }

  return routes;
}

function buildStopNumbers(order: string[]): Record<string, number> {
  return Object.fromEntries(order.map((id, index) => [id, index + 1]));
}

export function TodoApp() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduledRouteByDate, setScheduledRouteByDate] = useState<Record<string, ScheduledRoute>>(
    {},
  );

  const dateStr = formatDate(selectedDate);

  const dayTodos = useMemo(
    () => allTodos.filter((todo) => todo.date === dateStr),
    [allTodos, dateStr],
  );

  const todoItems = useMemo(() => dayTodos.filter((todo) => todo.state === "todo"), [dayTodos]);
  const scheduledItems = useMemo(
    () => dayTodos.filter((todo) => todo.state === "scheduled"),
    [dayTodos],
  );
  const scheduledRoute = scheduledRouteByDate[dateStr];
  const orderedScheduledItems = useMemo(() => {
    const order = scheduledRoute?.order ?? [];
    const byId = new Map(scheduledItems.map((todo) => [todo.id, todo]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((todo): todo is Todo => todo !== undefined);

    return ordered.length === scheduledItems.length ? ordered : scheduledItems;
  }, [scheduledItems, scheduledRoute, dateStr]);
  const scheduledStopNumbers = useMemo(
    () => orderedScheduledItems.map((todo) => scheduledRoute?.stopNumbers[todo.id]),
    [orderedScheduledItems, scheduledRoute],
  );
  const scheduledLegDistances = useMemo(() => {
    const distances: number[] = [];

    for (let index = 0; index < orderedScheduledItems.length - 1; index += 1) {
      distances.push(
        haversineMeters(
          orderedScheduledItems[index]!.location,
          orderedScheduledItems[index + 1]!.location,
        ),
      );
    }

    return distances;
  }, [orderedScheduledItems]);
  const doneItems = useMemo(() => dayTodos.filter((todo) => todo.state === "done"), [dayTodos]);

  const scheduledDates = useMemo(
    () =>
      allTodos
        .filter((todo) => todo.state === "scheduled")
        .map((todo) => parseISO(todo.date)),
    [allTodos],
  );

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllTodos();
      setAllTodos(data);
      setScheduledRouteByDate(buildScheduledRoutes(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
      setAllTodos([]);
      setScheduledRouteByDate({});
    } finally {
      setLoading(false);
    }
  }, []);

  function reoptimizeScheduledOrder(date: string, scheduled: Todo[]) {
    const order = greedyRouteOrder(scheduled);
    setScheduledRouteByDate((current) => ({
      ...current,
      [date]: {
        order,
        stopNumbers: buildStopNumbers(order),
      },
    }));
  }

  function removeFromScheduledOrder(date: string, id: string) {
    setScheduledRouteByDate((current) => {
      const route = current[date];
      if (!route) {
        return current;
      }

      return {
        ...current,
        [date]: {
          ...route,
          order: route.order.filter((todoId) => todoId !== id),
        },
      };
    });
  }

  function restoreToScheduledOrder(date: string, id: string) {
    setScheduledRouteByDate((current) => {
      const route = current[date];
      const stopNumber = route?.stopNumbers[id];
      if (!route || stopNumber === undefined || route.order.includes(id)) {
        return current;
      }

      const insertAt = route.order.findIndex(
        (todoId) => (route.stopNumbers[todoId] ?? Number.MAX_SAFE_INTEGER) > stopNumber,
      );
      const order =
        insertAt === -1
          ? [...route.order, id]
          : [...route.order.slice(0, insertAt), id, ...route.order.slice(insertAt)];

      return {
        ...current,
        [date]: {
          ...route,
          order,
        },
      };
    });
  }

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  async function handleCreate(input: CreateTodoInput) {
    setBusy(true);
    try {
      const todo = await createTodo(input);
      setAllTodos((current) => [...current, todo]);
    } finally {
      setBusy(false);
    }
  }

  async function handleSchedule(id: string) {
    setBusy(true);
    try {
      const updated = await updateTodo(id, { state: "scheduled" });
      setAllTodos((current) => {
        const next = current.map((todo) => (todo.id === id ? updated : todo));
        const scheduled = next.filter(
          (todo) => todo.date === updated.date && todo.state === "scheduled",
        );
        reoptimizeScheduledOrder(updated.date, scheduled);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule todo");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnschedule(id: string) {
    setBusy(true);
    try {
      const updated = await updateTodo(id, { state: "todo" });
      setAllTodos((current) => {
        const next = current.map((todo) => (todo.id === id ? updated : todo));
        const scheduled = next.filter(
          (todo) => todo.date === updated.date && todo.state === "scheduled",
        );
        reoptimizeScheduledOrder(updated.date, scheduled);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unschedule todo");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkDone(id: string) {
    setBusy(true);
    try {
      const updated = await updateTodo(id, { state: "done" });
      setAllTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
      removeFromScheduledOrder(updated.date, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark todo done");
    } finally {
      setBusy(false);
    }
  }

  async function handleUndoDone(id: string) {
    setBusy(true);
    try {
      const updated = await updateTodo(id, { state: "scheduled" });
      setAllTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
      restoreToScheduledOrder(updated.date, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to undo todo");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      const deleted = allTodos.find((todo) => todo.id === id);
      await deleteTodo(id);
      setAllTodos((current) => {
        const next = current.filter((todo) => todo.id !== id);
        if (deleted?.state === "scheduled") {
          const scheduled = next.filter(
            (todo) => todo.date === deleted.date && todo.state === "scheduled",
          );
          reoptimizeScheduledOrder(deleted.date, scheduled);
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Garden Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDisplayDate(dateStr)}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Calendar
              mode="single"
              navLayout="around"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              modifiers={{ scheduled: scheduledDates }}
              className="w-full p-1.5 [--cell-size:2.5rem]"
              classNames={{
                root: "w-full",
                months: "w-full",
              }}
            />

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading todos...</p>
            ) : (
              <div className="space-y-6">
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">
                      Todos for {format(parseISO(dateStr), "MMM d")}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setCreateOpen(true)}
                      disabled={busy}
                      aria-label="Add todo"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <TodoList
                    todos={todoItems}
                    variant="todo"
                    onSchedule={handleSchedule}
                    onDelete={handleDelete}
                    busy={busy}
                    emptyMessage="No todos for this day. Add one with +."
                  />
                </section>

                {scheduledItems.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium">Scheduled</h2>
                    <TodoList
                      todos={orderedScheduledItems}
                      variant="scheduled"
                      stopNumbers={scheduledStopNumbers}
                      legDistances={scheduledLegDistances}
                      onMarkDone={handleMarkDone}
                      onUnschedule={handleUnschedule}
                      onDelete={handleDelete}
                      busy={busy}
                    />
                  </section>
                )}

                {doneItems.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium">Done</h2>
                    <TodoList
                      todos={doneItems}
                      variant="done"
                      onUndoDone={handleUndoDone}
                      onDelete={handleDelete}
                      busy={busy}
                    />
                  </section>
                )}
              </div>
            )}

            <CreateTodoForm
              open={createOpen}
              onOpenChange={setCreateOpen}
              date={dateStr}
              onSubmit={handleCreate}
              disabled={busy}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
