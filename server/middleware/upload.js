import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

export const uploadImages = (files = []) => Promise.all(files.map((f) => new Promise((ok, no) =>
  cloudinary.uploader.upload_stream({ folder: 'marketplace' }, (e, r) => (e ? no(e) : ok(r.secure_url))).end(f.buffer))));
