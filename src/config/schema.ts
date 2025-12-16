import { z } from 'zod';

export const providerConfigSchema = z.object({
  provider: z
    .enum(['local', 'aws-kms', 'gcp-kms', 'azure-keyvault', 'vault-transit'])
    .default('local'),
  defaultKeyId: z.string().default('local-default'),
  fipsMode: z.boolean().default(false),
  auditEnabled: z.boolean().default(true),
  cacheTtlMs: z.number().default(300000),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

export function loadConfig(fromEnvironment = process.env): ProviderConfig {
  return providerConfigSchema.parse({
    provider: fromEnvironment.ENCRYPTION_PROVIDER as ProviderConfig['provider'],
    defaultKeyId: fromEnvironment.ENCRYPTION_KEY_ID,
    fipsMode: fromEnvironment.ENCRYPTION_FIPS === 'true',
    auditEnabled: fromEnvironment.ENCRYPTION_AUDIT !== 'false',
    cacheTtlMs: fromEnvironment.ENCRYPTION_CACHE_TTL ? Number(fromEnvironment.ENCRYPTION_CACHE_TTL) : undefined,
  });
}
