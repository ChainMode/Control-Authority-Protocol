import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

describe('CAP structure-only draft vectors', () => {
  it('keeps vector indexes draft, non-normative, and structure-only', () => {
    const index = readJson('vectors/structure/index.json') as {
      metadata: {
        status: string;
        normative: boolean;
        scope: string;
        decision_dependencies: string[];
      };
      cases: Array<{
        freezes_semantics: boolean;
        decision_fields_pending: string[];
      }>;
    };

    expect(index.metadata.status).toBe('draft');
    expect(index.metadata.normative).toBe(false);
    expect(index.metadata.scope).toBe('structure-only');
    expect(index.metadata.decision_dependencies).toEqual(
      expect.arrayContaining(['D-1', 'D-4', 'D-8', 'D-9']),
    );

    for (const vectorCase of index.cases) {
      expect(vectorCase.freezes_semantics).toBe(false);
      expect(vectorCase.decision_fields_pending.length).toBeGreaterThan(0);
    }
  });

  it('keeps the vector index schema scoped to metadata instead of CAP messages', () => {
    const schema = readJson('vectors/schema/vector-index.schema.json') as {
      title: string;
      description: string;
      properties: Record<string, unknown>;
    };

    expect(schema.title).toContain('vector index');
    expect(schema.description).toContain('metadata');
    expect(schema.properties).toHaveProperty('metadata');
    expect(schema.properties).toHaveProperty('cases');
    expect(schema.properties).not.toHaveProperty('ProtocolMessage');
    expect(schema.properties).not.toHaveProperty('AuthorizationDescriptor');
  });
});
