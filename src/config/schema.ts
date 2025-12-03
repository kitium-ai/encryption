import { z } from 'zod';

export const providerConfigSchema = z.object({
  provider: z.enum(['local', 'aws-kms', 'gcp-kms', 'azure-keyvault', 'vault-transit']).default('local'),
  defaultKeyId: z.string().default('local-default'),
  fipsMode: z.boolean().default(false),
  auditEnabled: z.boolean().default(true),
  cacheTtlMs: z.number().default(300000),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

export function loadConfig(fromEnv = process.env): ProviderConfig {
  return providerConfigSchema.parse({
    provider: fromEnv.ENCRYPTION_PROVIDER as ProviderConfig['provider'],
    defaultKeyId: fromEnv.ENCRYPTION_KEY_ID,
    fipsMode: fromEnv.ENCRYPTION_FIPS === 'true',
    auditEnabled: fromEnv.ENCRYPTION_AUDIT !== 'false',
    cacheTtlMs: fromEnv.ENCRYPTION_CACHE_TTL ? Number(fromEnv.ENCRYPTION_CACHE_TTL) : undefined,
  });
}
