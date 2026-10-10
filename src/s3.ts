import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFile } from 'node:fs/promises';

const s3 = new S3Client({});

/**
 * Descarga un objeto de S3 a un archivo local y devuelve la ruta.
 */
export async function downloadS3ObjectToFile(
  bucket: string,
  key: string,
  destination: string,
): Promise<string> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!response.Body) {
    throw new Error(`El objeto s3://${bucket}/${key} no tiene contenido.`);
  }

  const bytes = await response.Body.transformToByteArray();
  await writeFile(destination, Buffer.from(bytes));

  return destination;
}
