import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// db 연결
// 나중에 .env 로 분리해야된
mongoose.connect("mongodb://", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PredictionSchema = new mongoose.Schema({
  years: Number,
  predictedSalary: Number,
  createdAt: { type: Date, default: Date.now },
});
const Prediction = mongoose.model("Prediction", PredictionSchema);

// AWS AI 엔드포인트 URL
const MODEL_URL = "https://aws주소추가.com/salary-predict";

app.post("/api/predict", async (req, res) => {
  try {
    const { years } = req.body;

    // AWS 모델 호출
    const response = await axios.post(MODEL_URL, { years });

    const predictedSalary = response.data.predictedSalary;

    // DB에 저장
    const record = await Prediction.create({ years, predictedSalary });

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "예측 실패 failed" });
  }
});

app.get("/api/history", async (req, res) => {
  const records = await Prediction.find().sort({ createdAt: -1 });
  res.json(records);
});

app.listen(5000, () => console.log("포트 http://localhost:5000"));