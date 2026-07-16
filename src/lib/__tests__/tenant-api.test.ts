import {
  fromUnomiTenant,
  isSystemTenant,
  toUnomiTenantRequest,
  extractRawApiKeys,
  readPlainTextApiKey,
  type UnomiTenant,
} from '@/lib/tenant-api';

describe('toUnomiTenantRequest', () => {
  it('maps top-level name into properties.name', () => {
    expect(
      toUnomiTenantRequest({
        requestedId: 'acme-corp',
        name: 'Acme Corporation',
      })
    ).toEqual({
      requestedId: 'acme-corp',
      properties: { name: 'Acme Corporation' },
    });
  });

  it('omits name when blank and keeps other properties', () => {
    expect(
      toUnomiTenantRequest({
        requestedId: 'acme-corp',
        name: '  ',
        properties: { region: 'eu' },
      })
    ).toEqual({
      requestedId: 'acme-corp',
      properties: { region: 'eu' },
    });
  });

  it('does not send a top-level name field', () => {
    const body = toUnomiTenantRequest({
      requestedId: 'acme-corp',
      name: 'Acme',
    });
    expect(body).not.toHaveProperty('name');
    expect(Object.keys(body).sort()).toEqual(['properties', 'requestedId']);
  });
});

describe('fromUnomiTenant', () => {
  it('uses itemId as the managed tenant ID and reads the property name', () => {
    expect(
      fromUnomiTenant({
        itemId: 'freshkey',
        tenantId: 'system',
        properties: { name: 'Fresh' },
        creationDate: '2026-07-16T10:07:28Z',
        lastModificationDate: '2026-07-16T10:07:28Z',
        apiKeys: [
          {
            keyType: 'PUBLIC',
            maskedKey: 'unomi_v1_****D96F',
            revoked: false,
          },
        ],
      })
    ).toMatchObject({
      tenantId: 'freshkey',
      itemId: 'freshkey',
      name: 'Fresh',
      createdAt: '2026-07-16T10:07:28Z',
      updatedAt: '2026-07-16T10:07:28Z',
      apiKeys: [
        {
          type: 'PUBLIC',
          maskedKey: 'unomi_v1_****D96F',
          revoked: false,
        },
      ],
    });
  });

  it('prefers the top-level tenant name', () => {
    expect(
      fromUnomiTenant({
        itemId: 'acme',
        tenantId: 'system',
        name: 'Acme Corp',
        properties: { name: 'Property Name' },
      }).name
    ).toBe('Acme Corp');
  });
});

describe('extractRawApiKeys', () => {
  it('returns null when only masked keys are present', () => {
    expect(
      extractRawApiKeys({
        itemId: 'acme-corp',
        tenantId: 'system',
        apiKeys: [
          { keyType: 'PUBLIC', maskedKey: 'unomi_v1_****9B17', revoked: false },
          { keyType: 'PRIVATE', maskedKey: 'unomi_v1_****28A9', revoked: false },
        ],
      })
    ).toBeNull();
  });

  it('returns raw keys from generate/create responses', () => {
    expect(
      extractRawApiKeys({
        itemId: 'acme-corp',
        apiKeys: [
          { keyType: 'PUBLIC', key: 'pub-raw', revoked: false },
          { keyType: 'PRIVATE', key: 'priv-raw', revoked: false },
        ],
      })
    ).toEqual({
      publicApiKey: 'pub-raw',
      privateApiKey: 'priv-raw',
    });
  });
});

describe('readPlainTextApiKey', () => {
  it('reads plainTextKey from ApiKeyCreationResult', () => {
    expect(
      readPlainTextApiKey({
        apiKey: {
          keyType: 'PUBLIC',
          maskedKey: 'unomi_v1_****AB12',
          revoked: false,
        },
        plainTextKey: 'unomi_v1_PLAINTEXTPUBLICKEYVALUE',
      })
    ).toBe('unomi_v1_PLAINTEXTPUBLICKEYVALUE');
  });

  it('falls back to legacy key field', () => {
    expect(readPlainTextApiKey({ key: 'legacy-raw-key', keyType: 'PRIVATE' })).toBe(
      'legacy-raw-key'
    );
  });
});
describe('isSystemTenant', () => {
  it('does not treat a tenant as reserved because its persistence tenant is system', () => {
    const tenant: UnomiTenant = {
      itemId: 'freshkey',
      tenantId: 'system',
      properties: {},
    };

    expect(isSystemTenant(tenant)).toBe(false);
  });

  it('filters reserved item IDs', () => {
    expect(isSystemTenant({ itemId: 'system' })).toBe(true);
    expect(isSystemTenant({ itemId: '_internal-bootstrap' })).toBe(true);
  });
});
