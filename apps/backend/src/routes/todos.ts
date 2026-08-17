import { Router } from "express";
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  updateTodo,
} from "../store/todos";
import { isValidDate, validateCreateInput, validateUpdateInput } from "../types/todo";

const router = Router();

function requireTenantId(req: import("express").Request, res: import("express").Response): string | null {
  const tenantId = req.tenantId;
  if (typeof tenantId !== "string") {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return tenantId;
}

router.get("/", async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) {
      return;
    }

    const { date } = req.query;

    if (date !== undefined) {
      if (typeof date !== "string" || !isValidDate(date)) {
        res.status(400).json({ error: "date query must be YYYY-MM-DD" });
        return;
      }
      res.json(await listTodos(tenantId, date));
      return;
    }

    res.json(await listTodos(tenantId));
  } catch (err) {
    console.error("Failed to list todos:", err);
    res.status(500).json({ error: "Failed to list todos" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) {
      return;
    }

    const todo = await getTodo(tenantId, req.params.id);
    if (!todo) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }
    res.json(todo);
  } catch (err) {
    console.error("Failed to get todo:", err);
    res.status(500).json({ error: "Failed to get todo" });
  }
});

router.post("/", async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) {
      return;
    }

    const result = validateCreateInput(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const todo = await createTodo(tenantId, result.data);
    res.status(201).json(todo);
  } catch (err) {
    console.error("Failed to create todo:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) {
      return;
    }

    const result = validateUpdateInput(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const todo = await updateTodo(tenantId, req.params.id, result.data);
    if (!todo) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    res.json(todo);
  } catch (err) {
    console.error("Failed to update todo:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res);
    if (!tenantId) {
      return;
    }

    const deleted = await deleteTodo(tenantId, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Todo not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete todo:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

export default router;
