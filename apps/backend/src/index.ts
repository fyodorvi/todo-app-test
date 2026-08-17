import "./env";
import cors from "cors";
import express from "express";
import { checkJwt, setTenantId } from "./middleware/auth";
import todosRouter from "./routes/todos";
import { isTodosTableReachable } from "./store/todos";

const app = express();
const port = 3000;

const cloudfrontUrl = process.env.CLOUDFRONT_URL;

app.use(
  cors({
    origin: cloudfrontUrl
      ? [cloudfrontUrl, cloudfrontUrl.replace(/\/$/, "")]
      : true,
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.use("/api/todos", checkJwt, setTenantId, todosRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
