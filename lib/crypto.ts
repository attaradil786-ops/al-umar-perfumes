import crypto from 'crypto';

function getKeyBuffer(): Buffer {
  const rawKey = process.env.TOTP_ENCRYPTION_KEY || 'default-secret-key-must-be-32-bytes-long!';
  // Normalize key to 32 bytes via sha256
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Output format: iv_hex:tag_hex:ciphertext_hex
 */
export function encryptSecret(text: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a ciphertext string formatted as iv_hex:tag_hex:ciphertext_hex using AES-256-GCM.
 */
export function decryptSecret(cipherString: string): string {
  const parts = cipherString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
