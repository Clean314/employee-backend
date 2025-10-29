import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch(err => console.error("MongoDB 연결 실패:", err));

// 스키마 정의
const PredictionSchema = new mongoose.Schema({
  years: Number,
  predictedSalary: Number,
  createdAt: { type: Date, default: Date.now },
});
const Prediction = mongoose.model("Prediction", PredictionSchema);

// SageMaker 클라이언트
const client = new SageMakerRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 환경변수에서 엔드포인트 이름 가져오기
const ENDPOINT_NAME = process.env.ENDPOINT_NAME;

// 예측 API
app.post("/api/predict", async (req, res) => {
  try {
    const { years } = req.body;
    if (years === undefined) return res.status(400).json({ error: "years 값 필요" });

    const command = new InvokeEndpointCommand({
      EndpointName: ENDPOINT_NAME,
      Body: Buffer.from(`${years}`),
      ContentType: "text/csv",
      Accept: "text/csv",
    });

    const response = await client.send(command);
    const predictedSalary = parseFloat(Buffer.from(response.Body).toString("utf-8").trim());

    const record = await Prediction.create({ years, predictedSalary });
    res.json(record);
  } catch (err) {
    console.error("예측 실패:", err);
    res.status(500).json({ error: "예측 실패" });
  }
});

// 예측 이력 조회
app.get("/api/history", async (req, res) => {
  const records = await Prediction.find().sort({ createdAt: -1 });
  res.json(records);
});

app.listen(5000, () => console.log("서버 실행 중: http://localhost:5000"));