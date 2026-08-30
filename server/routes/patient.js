import express from 'express';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/genetic-tests/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const { testType, notes } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    console.log('Received file:', file.originalname);
    console.log('Test metadata:', { testType, notes });

    return res.status(200).json({
      message: 'Genetic test file uploaded successfully.',
      fileDetails: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        testType,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Server error processing file.' });
  }
});

export default router;