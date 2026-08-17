import cors from "cors";
import express from "express";
import { isTodosTableReachable } from "./store/todos";
import todosRouter from "./routes/todos";

const app = express();
const port = 3000;

const cloudfrontUrl = process.env.CLOUDFRONT_URL;

app.use(
  cors({
    origin: cloudfrontUrl
      ? [cloudfrontUrl, cloudfrontUrl.replace(/\/$/, "")]
      : true,
  }),
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  const dynamodb = await isTodosTableReachable();
  if (!dynamodb) {
    res.status(503).json({ status: "degraded", dynamodb: false });
    return;
  }

  res.json({ status: "ok", dynamodb: true });
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use("/api/todos", todosRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
