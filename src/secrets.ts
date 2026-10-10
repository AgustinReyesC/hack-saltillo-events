import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let cachedApiKey: string | undefined;

/**
 * Obtiene la API key de Gemini.
 * Prioridad:
 *   1. process.env.GEMINI_API_KEY (dev local / override)
 *   2. AWS Secrets Manager (GEMINI_API_KEY_SECRET_ID o GEMINI_API_KEY_SECRET_ARN)
 *
 * El secreto puede ser el valor crudo o un JSON con las claves
 * GEMINI_API_KEY / apiKey / value.
 */
export async function getGeminiApiKey(): Promise<string | undefined> {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  if (cachedApiKey) {
    return cachedApiKey;
  }

  const secretId =
    process.env.GEMINI_API_KEY_SECRET_ID ??
    process.env.GEMINI_API_KEY_SECRET_ARN;

  if (!secretId) {
    return undefined;
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );

  const secretString = response.SecretString;
  if (!secretString) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(secretString) as Record<string, string>;
    cachedApiKey =
      parsed.GEMINI_API_KEY ??
      parsed.apiKey ??
      parsed.value ??
      secretString;
  } catch {
    cachedApiKey = secretString;
  }

  return cachedApiKey;
}
