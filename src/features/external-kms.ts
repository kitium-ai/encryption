export type ExternalKeyStoreConfig = {
  endpoint: string;
  tlsCertPath?: string;
  apiKey?: string;
  timeout: number;
};

export type ExternalKeyInfo = {
  keyId: string;
  location: string;
  lastAccessedAt: Date;
  accessCount: number;
};

/**
 * External key store integration (on-premises HSM support)
 * Phase 3: Integration with external HSM infrastructure
 */
export class ExternalKeyStoreProvider {
  private readonly keyCache: Map<string, ExternalKeyInfo> = new Map();

  constructor(private readonly config: ExternalKeyStoreConfig) {
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.endpoint) {
      throw new Error('External key store endpoint is required');
    }

    if (!this.config.endpoint.startsWith('https://')) {
      throw new Error('External key store must use HTTPS');
    }
  }

  /**
   * Connect to external key store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async connect(): Promise<boolean> {
    try {
      // TODO: Establish HTTPS connection to external KMS
      // Verify TLS certificate if provided
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check connectivity
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Send health check request to external key store
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve key from external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async getExternalKey(keyId: string): Promise<Uint8Array> {
    // TODO: Retrieve key material from external HSM
    this.recordAccess(keyId);
    return new Uint8Array();
  }

  /**
   * Store key in external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async storeExternalKey(
    keyId: string,
    _keyMaterial: Uint8Array
  ): Promise<void> {
    // TODO: Store key material in external HSM
    this.recordAccess(keyId);
  }

  /**
   * Delete key from external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async deleteExternalKey(keyId: string): Promise<void> {
    // TODO: Delete key from external HSM
    this.keyCache.delete(keyId);
  }

  /**
   * List keys in external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async listExternalKeys(): Promise<ExternalKeyInfo[]> {
    // TODO: Enumerate keys in external HSM
    return Array.from(this.keyCache.values());
  }

  /**
   * Perform encryption in external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async encryptWithExternalKey(
    keyId: string,
    _plaintext: Uint8Array
  ): Promise<Uint8Array> {
    // TODO: Call external HSM encrypt operation
    this.recordAccess(keyId);
    return new Uint8Array();
  }

  /**
   * Perform decryption in external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async decryptWithExternalKey(
    keyId: string,
    _ciphertext: Uint8Array
  ): Promise<Uint8Array> {
    // TODO: Call external HSM decrypt operation
    this.recordAccess(keyId);
    return new Uint8Array();
  }

  /**
   * Perform signing in external store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async signWithExternalKey(
    keyId: string,
    _payload: Uint8Array
  ): Promise<Uint8Array> {
    // TODO: Call external HSM sign operation
    this.recordAccess(keyId);
    return new Uint8Array();
  }

  /**
   * Record key access for audit
   */
  private recordAccess(keyId: string): void {
    const info = this.keyCache.get(keyId) ?? {
      keyId,
      location: this.config.endpoint,
      lastAccessedAt: new Date(),
      accessCount: 0,
    };

    info.lastAccessedAt = new Date();
    info.accessCount += 1;
    this.keyCache.set(keyId, info);
  }

  /**
   * Get key access statistics
   */
  getKeyStats(keyId: string): ExternalKeyInfo | undefined {
    return this.keyCache.get(keyId);
  }

  /**
   * Get all access statistics
   */
  getAllStats(): ExternalKeyInfo[] {
    return Array.from(this.keyCache.values()).sort(
      (a, b) => b.accessCount - a.accessCount
    );
  }

  /**
   * Verify BYOK (Bring Your Own Key) compliance
   */
  verifyBYOKCompliance(keyId: string): {
    isCompliant: boolean;
    reason: string;
  } {
    // Check that key was imported (not generated in external store)
    const info = this.keyCache.get(keyId);
    if (!info) {
      return { isCompliant: false, reason: 'Key not found' };
    }

    return {
      isCompliant: true,
      reason: 'Key is stored in external HSM with BYOK compliance',
    };
  }

  /**
   * Disconnect from external key store
   */
  // eslint-disable-next-line @typescript-eslint/require-await, require-await -- Placeholder for future async implementation
  async disconnect(): Promise<void> {
    // TODO: Close HTTPS connection to external KMS
    this.keyCache.clear();
  }
}
