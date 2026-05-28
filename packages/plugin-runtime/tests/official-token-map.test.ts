import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const tokenMapSkill = readFileSync(
  `${repoRoot}/plugins/_official/atoms/token-map/SKILL.md`,
  'utf8',
);
const semanticInferenceFixture = JSON.parse(
  readFileSync(
    `${repoRoot}/plugins/_official/atoms/token-map/examples/semantic-inference-before-after.json`,
    'utf8',
  ),
) as {
  simulationKind: string;
  sourceTokens: Array<{ source: string }>;
  beforeRun: {
    mapped: Array<{ source: string }>;
    unmatched: Array<{ source: string }>;
    coverage: { mapped: number; total: number; ratio: number };
  };
  afterRun: {
    mapped: Array<{ source: string; target: string; evidence: string[] }>;
    unmatched: Array<{ source: string }>;
    coverage: { mapped: number; total: number; ratio: number };
  };
};

describe('official token-map prompt fragment', () => {
  it('requires semantic inference for anonymous Figma tokens', () => {
    expect(tokenMapSkill).toContain('## Semantic token inference');
    expect(tokenMapSkill).toContain('color-3');
    expect(tokenMapSkill).toContain('Node path, component name');
    expect(tokenMapSkill).toContain('focus-ring');
    expect(tokenMapSkill).toContain('ambiguous-semantic-role');
  });

  it('documents the before and after expectation without claiming measured lift', () => {
    expect(tokenMapSkill).toContain('### Before / after expectation');
    expect(tokenMapSkill).toContain('anonymous-source-token');
    expect(tokenMapSkill).toContain('Active nav item');
    expect(tokenMapSkill).toContain('does not claim a measured accuracy lift');
    expect(tokenMapSkill).toContain('Real accuracy numbers require a fixture suite');
  });

  it('includes a same-token-batch before and after simulation fixture', () => {
    expect(tokenMapSkill).toContain('examples/semantic-inference-before-after.json');
    expect(semanticInferenceFixture.simulationKind).toBe('deterministic-fixture');

    const sources = new Set(semanticInferenceFixture.sourceTokens.map((token) => token.source));
    const beforeSources = new Set([
      ...semanticInferenceFixture.beforeRun.mapped.map((token) => token.source),
      ...semanticInferenceFixture.beforeRun.unmatched.map((token) => token.source),
    ]);
    const afterSources = new Set([
      ...semanticInferenceFixture.afterRun.mapped.map((token) => token.source),
      ...semanticInferenceFixture.afterRun.unmatched.map((token) => token.source),
    ]);

    expect(beforeSources).toEqual(sources);
    expect(afterSources).toEqual(sources);
    expect(semanticInferenceFixture.beforeRun.coverage).toEqual({ mapped: 0, total: 8, ratio: 0 });
    expect(semanticInferenceFixture.afterRun.coverage).toEqual({
      mapped: 7,
      total: 8,
      ratio: 0.875,
    });
    expect(semanticInferenceFixture.afterRun.mapped.every((token) => token.evidence.length > 0)).toBe(
      true,
    );
  });
});
