
const express = require("express");
const multer = require("multer");
const { Readable } = require("stream");
const mongoose = require("mongoose");
const { rateLimit } = require("express-rate-limit");

const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many image uploads. Please try again after 15 minutes.",
  },
});

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const validateImageFile = async (file) => {
  const { fileTypeFromBuffer } = await import("file-type");

  const fileType = await fileTypeFromBuffer(file.buffer);

  if (!fileType || !allowedImageTypes.includes(fileType.mime)) {
    throw new Error(
      "Only JPG, PNG, WEBP, and GIF images are allowed."
    );
  }

  if (file.mimetype !== fileType.mime) {
    throw new Error("Image file type does not match its actual content.");
  }

  return true;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, WEBP, and GIF images are allowed.")
      );
    }

    callback(null, true);
  },
});

// GET /api/images - Public: fetch all images
router.get("/", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("Error fetching images:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch images.",
    });
  }
});

// POST /api/images/upload - Admin only
router.post(
  "/upload",
  uploadLimiter,
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    let uploadedImage;

    try {
      const title = req.body.title?.trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Image title is required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      await validateImageFile(req.file);

      uploadedImage = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "picture-to-picture",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        Readable.from(req.file.buffer).pipe(stream);
      });

      const image = await Image.create({
        title,
        imageUrl: uploadedImage.secure_url,
        cloudinaryId: uploadedImage.public_id,
      });

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        image,
      });
    } catch (error) {
      console.error("Image upload error:", error.message);

      if (uploadedImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(uploadedImage.public_id);
        } catch (cleanupError) {
          console.error("Cloudinary cleanup failed:", cleanupError.message);
        }
      }

      const isValidationError =
        error.message.includes("Only JPG") ||
        error.message.includes("does not match");

      res.status(isValidationError ? 400 : 500).json({
        success: false,
        message: isValidationError
          ? error.message
          : "Image upload failed. Please try again.",
      });
    }
  }
);

// DELETE /api/images/:id - Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID.",
      });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(
      image.cloudinaryId,
      { resource_type: "image" }
    );

    if (
      cloudinaryResult.result !== "ok" &&
      cloudinaryResult.result !== "not found"
    ) {
      return res.status(502).json({
        success: false,
        message: "Could not delete the image from Cloudinary.",
      });
    }

    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Image deletion error:", error.message);

    res.status(500).json({
      success: false,
      message: "Image deletion failed. Please try again.",
    });
  }
});

// Handle Multer and upload validation errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : err.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid upload.",
    });
  }

  next();
});

// PUT /api/images/:id - Admin only: update image title
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const title = req.body.title?.trim();

    // Validate image ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID.",
      });
    }

    // Validate title
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Image title is required.",
      });
    }

    // Find and update image
    const image = await Image.findByIdAndUpdate(
      id,
      { title },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image title updated successfully.",
      image,
    });
  } catch (error) {
    console.error("Image update error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update image title.",
    });
  }
});

module.exports = router;
