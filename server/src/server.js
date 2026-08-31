const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const leadRoutes = require("./routes/LeadRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SignalQueue API is running",
  });
});

app.use("/api/leads", leadRoutes);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    success: false,
    message: error.message || "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `SignalQueue server running on http://localhost:${PORT}`
  );
});