const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { LlamaCloud } = require('@llamaindex/llama-cloud');

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
  const configId = 'cfg-5kdagyqdt8c57ev4vghzdu0xo2w7';

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'policyDoc file is required' });
    }

    const apiKey = process.env.LLAMA_EXTRACT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'LLAMA_EXTRACT_API_KEY is not configured' });
    }

    const client = new LlamaCloud({ apiKey });

    const fileStream = fs.createReadStream(tempFilePath);
    const uploadedFile = await client.files.create({
      file: fileStream,
      purpose: 'extract'
    });

    const createdJob = await client.extract.create({
      file_input: uploadedFile.id,
      configuration_id: configId
    });

    let jobStatus = null;
    let attempts = 0;
    while (attempts < 60) {
      jobStatus = await client.extract.get(createdJob.id);
      if (jobStatus && jobStatus.status === 'COMPLETED') {
        break;
      }
      if (jobStatus && jobStatus.status === 'FAILED') {
        return res.status(500).json({ success: false, message: 'Extraction job failed' });
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts += 1;
    }

    if (!jobStatus || jobStatus.status !== 'COMPLETED') {
      return res.status(500).json({ success: false, message: 'Extraction job did not complete in time' });
    }

    const parsedResult =
      jobStatus?.result?.data ||
      jobStatus?.result?.output ||
      jobStatus?.result?.content ||
      jobStatus?.result ||
      jobStatus?.data ||
      jobStatus?.output ||
      null;

    return res.status(200).json({
      success: true,
      jobStatus: parsedResult,
      rawJob: jobStatus
    });
  } catch (error) {
    console.error('LlamaCloud extraction error:', error);
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
