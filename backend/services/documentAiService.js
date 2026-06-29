const fs = require('fs');
const path = require('path');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

function getCredentialsPath() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const localPath = path.resolve(__dirname, '..', 'gcp.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  return undefined;
}

function loadProjectIdFromKeyFile(keyFilename) {
  if (!keyFilename) return null;
  try {
    const raw = fs.readFileSync(keyFilename, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.project_id || parsed.projectId || null;
  } catch (error) {
    return null;
  }
}

function createClient() {
  const keyFilename = getCredentialsPath();
  const options = {};
  if (keyFilename) {
    options.keyFilename = keyFilename;
  }
  return new DocumentProcessorServiceClient(options);
}

function getProjectId() {
  const credentialsProjectId = loadProjectIdFromKeyFile(getCredentialsPath());
  return credentialsProjectId || process.env.DOCUMENT_AI_PROJECT_ID || process.env.GCP_PROJECT_ID;
}

function normalizeEntity(entity) {
  return {
    type: entity.type || null,
    mentionText: entity.mentionText || null,
    confidence: entity.confidence ?? null,
    normalizedValue: entity.normalizedValue
      ? {
          text: entity.normalizedValue.text || null,
          kind: entity.normalizedValue.kind || null
        }
      : null,
    pageNumber: entity.pageReferences?.[0]?.page ?? null,
    boundingPoly: entity.pageReferences?.[0]?.boundingPoly || null,
    metadata: entity.properties?.map((property) => ({
      type: property.type,
      mentionText: property.mentionText,
      confidence: property.confidence
    })) || null
  };
}

function normalizeDocument(document) {
  return {
    text: document.text || '',
    mimeType: document.mimeType || null,
    pageCount: document.pages?.length || 0,
    entities: Array.isArray(document.entities)
      ? document.entities.map(normalizeEntity)
      : [],
    pages: Array.isArray(document.pages)
      ? document.pages.map((page, index) => ({
          pageNumber: index + 1,
          pageText: page.layout?.textAnchor?.textSegments?.map((segment) => segment.text).join('') || ''
        }))
      : []
  };
}

async function processDocument({ processorId, location = 'us', fileBuffer, mimeType }) {
  if (!processorId) {
    throw new Error('DOCUMENT_AI_PROCESSOR_ID must be provided via form data or environment variable DOCUMENT_AI_PROCESSOR_ID');
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Document AI project ID is missing. Set DOCUMENT_AI_PROJECT_ID or GCP_PROJECT_ID, or provide a valid gcp.json service account file.');
  }

  const client = createClient();
  const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const [response] = await client.processDocument({
    name: processorName,
    rawDocument: {
      content: fileBuffer.toString('base64'),
      mimeType
    }
  });

  const document = response.document || {};
  return normalizeDocument(document);
}

module.exports = { processDocument };
