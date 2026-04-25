import express from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { buffer, public_id } = req.body;
    if (public_id) {
      await cloudinary.v2.uploader.destroy(public_id);
    }
    // nếu có ảnh cũ thì xóa đi để tránh lãng phí dung lượng lưu trữ
    const cloud = await cloudinary.v2.uploader.upload(buffer);
    // upload ảnh mới lên Cloudinary
    res.json({
      url: cloud.secure_url,
      public_id: cloud.public_id,
    });
    // trả về URL và public_id của ảnh mới để frontend có thể sử dụng
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
