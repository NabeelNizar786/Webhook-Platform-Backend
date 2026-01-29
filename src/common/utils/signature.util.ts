import * as crypto from 'crypto';

export function verifySignature(
  secret: string,
  rawBody: Buffer,
  receivedSignature: string,
): boolean {
  const cleanedBody = rawBody.toString('utf-8').replace(/^\s+|\s+$/g, '');
  const bodyToHash = Buffer.from(cleanedBody);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyToHash)
    .digest('hex');

  console.log('Expected Signature:', expectedSignature);
  console.log('Received Signature:', receivedSignature);

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature),
  );
}
