const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `policy-doc-${Date.now()}-${path.basename(file.originalname)}`)
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/api/extract-policy', upload.single('policyDoc'), async (req, res) => {
  const tempFilePath = req.file && req.file.path;
  const apiUrl = 'https://ocr.alluresofttech.com/extract';

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'policyDoc file is required' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const ocrResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const responseJson = await ocrResponse.json();
    if (!ocrResponse.ok) {
      const message = responseJson?.message || `OCR service returned status ${ocrResponse.status}`;
      return res.status(502).json({ success: false, message });
    }

    return res.status(200).json(responseJson);
  } catch (error) {
    console.error('OCR extraction error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Extraction failed' });
  } finally {
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Temporary file cleanup failed:', cleanupError.message);
      }
    }
  }
});

module.exports = router;
