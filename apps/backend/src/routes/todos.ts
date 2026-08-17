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

router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    if (date !== undefined) {
      if (typeof date !== "string" || !isValidDate(date)) {
        res.status(400).json({ error: "date query must be YYYY-MM-DD" });
        return;
      }
      res.json(await listTodos(date));
      return;
    }

    res.json(await listTodos());
  } catch (err) {
    console.error("Failed to list todos:", err);
    res.status(500).json({ error: "Failed to list todos" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const todo = await getTodo(req.params.id);
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
    const result = validateCreateInput(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const todo = await createTodo(result.data);
    res.status(201).json(todo);
  } catch (err) {
    console.error("Failed to create todo:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const result = validateUpdateInput(req.body);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const todo = await updateTodo(req.params.id, result.data);
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
    const deleted = await deleteTodo(req.params.id);
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
