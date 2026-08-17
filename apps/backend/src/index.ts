import cors from "cors";
import express from "express";
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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.use("/api/todos", todosRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
