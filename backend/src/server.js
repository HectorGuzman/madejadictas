import express from "express";
import cors from "cors";
import morgan from "morgan";
import productsRouter from "./routes/products.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/healthz", (req, res) =>
  res.json({ status: "ok", service: "madejadictas-backend" })
);

app.use("/api/products", productsRouter);

app.use((err, req, res, next) => {
  if (err.name === "ZodError") {
    return res.status(400).json({ error: err.errors });
  }

  console.error(err);
  return res.status(500).json({ error: "Error inesperado" });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
