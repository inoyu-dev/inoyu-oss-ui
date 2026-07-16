import {
  buildFeatureFlagEnvOverrides,
  getDefaultFeatureFlags,
  mergeFeatureFlags,
  parseFeatureFlagEnv,
} from '@/config/feature-flags';

describe('parseFeatureFlagEnv', () => {
  it('returns undefined when unset so deployment defaults apply', () => {
    expect(parseFeatureFlagEnv(undefined)).toBeUndefined();
    expect(parseFeatureFlagEnv('')).toBeUndefined();
  });

  it('parses explicit true/false', () => {
    expect(parseFeatureFlagEnv('true')).toBe(true);
    expect(parseFeatureFlagEnv('false')).toBe(false);
  });
});

describe('buildFeatureFlagEnvOverrides', () => {
  it('does not force groovyActions off when FEATURE_GROOVY_ACTIONS is unset', () => {
    expect(buildFeatureFlagEnvOverrides({})).toEqual({});
  });

  it('includes only explicitly set flags', () => {
    expect(
      buildFeatureFlagEnvOverrides({
        FEATURE_GROOVY_ACTIONS: 'false',
        FEATURE_ADVANCED_SETTINGS: 'true',
      })
    ).toEqual({
      groovyActions: false,
      advancedSettings: true,
    });
  });
});

describe('on-premise groovy actions default', () => {
  it('enables groovyActions for on-premise when env override is unset', () => {
    const flags = mergeFeatureFlags('on-premise', buildFeatureFlagEnvOverrides({}));
    expect(flags.groovyActions).toBe(true);
    expect(flags).toMatchObject(getDefaultFeatureFlags('on-premise'));
  });

  it('allows disabling groovyActions via env on on-premise', () => {
    const flags = mergeFeatureFlags(
      'on-premise',
      buildFeatureFlagEnvOverrides({ FEATURE_GROOVY_ACTIONS: 'false' })
    );
    expect(flags.groovyActions).toBe(false);
  });
});
