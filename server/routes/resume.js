const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* All resume routes require authentication */
router.use(authenticate);

/**
 * Multer storage configuration.
 * Saves to ./uploads/{userId}/ with original filename.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', String(req.user.id));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    /* Preserve original filename */
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .docx, and .doc files are allowed.'));
    }
  },
});

/**
 * POST /api/resume/upload
 * Uploads a resume file.
 * Body (multipart): file, jobRole, proofPoints
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { jobRole, proofPoints } = req.body;
    const userId = req.user.id;

    /* Delete previous resume record (keep one resume per user) */
    const existing = db.prepare('SELECT * FROM resumes WHERE user_id = ?').get(userId);
    if (existing) {
      /* Delete old file from disk */
      if (fs.existsSync(existing.stored_path)) {
        fs.unlinkSync(existing.stored_path);
      }
      db.prepare('DELETE FROM resumes WHERE user_id = ?').run(userId);
    }

    /* Insert new resume record */
    const storedPath = req.file.path;
    db.prepare(
      'INSERT INTO resumes (user_id, original_filename, stored_path, job_role, proof_points) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, req.file.originalname, storedPath, jobRole || null, proofPoints || null);

    res.status(201).json({
      message: 'Resume uploaded successfully.',
      resume: {
        filename: req.file.originalname,
        jobRole: jobRole || null,
        proofPoints: proofPoints || null,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Resume upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload resume.' });
  }
});

/**
 * GET /api/resume
 * Returns the current resume info for the authenticated user.
 */
router.get('/', (req, res) => {
  try {
    const resume = db.prepare(
      'SELECT id, original_filename, job_role, proof_points, uploaded_at FROM resumes WHERE user_id = ?'
    ).get(req.user.id);

    if (!resume) {
      return res.json({ resume: null });
    }

    res.json({
      resume: {
        id: resume.id,
        filename: resume.original_filename,
        jobRole: resume.job_role,
        proofPoints: resume.proof_points,
        uploadedAt: resume.uploaded_at,
      },
    });
  } catch (err) {
    console.error('Get resume error:', err.message);
    res.status(500).json({ error: 'Failed to get resume.' });
  }
});

/**
 * DELETE /api/resume
 * Deletes the current resume (file + DB record) for the authenticated user.
 */
router.delete('/', (req, res) => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE user_id = ?').get(req.user.id);

    if (!resume) {
      return res.status(404).json({ error: 'No resume found.' });
    }

    /* Delete file from disk */
    if (fs.existsSync(resume.stored_path)) {
      fs.unlinkSync(resume.stored_path);
    }

    db.prepare('DELETE FROM resumes WHERE user_id = ?').run(req.user.id);

    res.json({ message: 'Resume deleted successfully.' });
  } catch (err) {
    console.error('Delete resume error:', err.message);
    res.status(500).json({ error: 'Failed to delete resume.' });
  }
});

module.exports = router;
