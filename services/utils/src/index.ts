import dotenv from "dotenv";
import express from "express";
import routes from "./routes.js";
import { v2 as cloudinary } from "cloudinary";
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.API_KEY!,
  api_secret: process.env.API_SECRET!,
});

const app = express();
app.use(express.json({ limit: "50mb" }));
// limit the size of URL-encoded data to prevent potential abuse
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// gắn vào req.body để backend xử lý

app.use("/api/utils", routes);

app.listen(process.env.PORT || 5001, () => {
  console.log(`Utils service is running on port ${process.env.PORT || 5001}`);
});
