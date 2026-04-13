/* ================================================
   iaNanoLeads — Configuration Cloudflare R2
   Stockage fichiers CSV/JSON leads
   ================================================ */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'iananoleads-storage';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://medias.w2k-digital.com';

let r2Client = null;

function getR2Client() {
  if (!r2Client && R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });
  }
  return r2Client;
}

/**
 * Upload un fichier sur Cloudflare R2
 */
async function uploadToR2(key, content, contentType = 'text/csv') {
  const client = getR2Client();
  if (!client) {
    throw new Error('[R2] Client non configuré. Vérifiez les variables d\'environnement.');
  }

  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Génère une URL pré-signée temporaire pour téléchargement
 */
async function getPresignedUrl(key, expiresInSeconds = 3600) {
  const client = getR2Client();
  if (!client) throw new Error('[R2] Client non configuré.');

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

module.exports = { uploadToR2, getPresignedUrl };
