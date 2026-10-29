import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe randomized filename preventing path traversal and name collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(12).toString('hex');
    const safeName = `resume-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only PDF files
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF files are permitted for resumes.'), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
});
