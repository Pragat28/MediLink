const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "medilink",
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

module.exports = multer({ storage });
