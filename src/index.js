import express from "express";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import metricsRouter from "./routes/metrics.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/analyze", analyzeRouter);
app.use("/metrics", metricsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
