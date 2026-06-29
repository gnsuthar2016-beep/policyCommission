const express = require('express');
const multer = require('multer');
const { processDocument } = require('../services/documentAiService');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.post('/api/document-ai/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const processorId = req.body.processorId || process.env.DOCUMENT_AI_PROCESSOR_ID || process.env.GCP_PROCESSOR_ID;
    const location = req.body.location || process.env.DOCUMENT_AI_LOCATION || process.env.GCP_LOCATION || 'us';
    const mimeType = req.file.mimetype;

    const result = await processDocument({
      processorId,
      location,
      fileBuffer: req.file.buffer,
      mimeType
    });

    res.status(200).json({
      success: true,
      message: 'Document processed successfully',
      data: {
        text: result.text || '',
        pageCount: result.pageCount || 0,
        entities: result.entities || [],
        pages: result.pages || []
      }
    });
  } catch (error) {
    console.error('Document AI error:', error);
    res.status(500).json({ success: false, message: error.message || 'Document AI processing failed' });
  }
});

module.exports = router;
