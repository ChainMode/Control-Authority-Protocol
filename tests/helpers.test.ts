import { describe, it, expect } from 'vitest';
import {
  extractHeadings,
  extractGlossaryTerms,
  extractBodyTerms,
  countSummaryWords,
  countWords,
  extractMermaidBlocks,
  sectionContains,
  extractSection,
  blueprintPath,
  SUPPORTED_LANGUAGES,
} from './helpers';

// ---------------------------------------------------------------------------
// 1. extractHeadings
// ---------------------------------------------------------------------------
describe('extractHeadings', () => {
  it('extracts a single heading', () => {
    const md = '# Hello World';
    expect(extractHeadings(md)).toEqual([{ level: 1, text: 'Hello World' }]);
  });

  it('extracts multiple headings at different levels', () => {
    const md = [
      '# Title',
      '## Section A',
      '### Subsection A.1',
      '## Section B',
    ].join('\n');
    expect(extractHeadings(md)).toEqual([
      { level: 1, text: 'Title' },
      { level: 2, text: 'Section A' },
      { level: 3, text: 'Subsection A.1' },
      { level: 2, text: 'Section B' },
    ]);
  });

  it('skips headings inside fenced code blocks', () => {
    const md = [
      '# Real Heading',
      '```',
      '# Not A Heading',
      '```',
      '## Another Real Heading',
    ].join('\n');
    expect(extractHeadings(md)).toEqual([
      { level: 1, text: 'Real Heading' },
      { level: 2, text: 'Another Real Heading' },
    ]);
  });

  it('returns empty array for markdown with no headings', () => {
    expect(extractHeadings('Just some text\nAnother line')).toEqual([]);
  });

  it('handles level 6 headings', () => {
    const md = '###### Deep Heading';
    expect(extractHeadings(md)).toEqual([{ level: 6, text: 'Deep Heading' }]);
  });
});


// ---------------------------------------------------------------------------
// 2. extractGlossaryTerms
// ---------------------------------------------------------------------------
describe('extractGlossaryTerms', () => {
  it('parses Chinese glossary format with parenthesized English terms', () => {
    const md = [
      '## 术语表',
      '',
      '- **控制权限协议（CAP）**：定义终端设备如何验证授权',
      '- **授权描述文件（Authorization_Descriptor）**：存储在终端本地的加密文件',
    ].join('\n');
    const terms = extractGlossaryTerms(md);
    expect(terms).toHaveLength(2);
    expect(terms[0]).toEqual({
      localTerm: '控制权限协议',
      englishTerm: 'CAP',
      definition: '定义终端设备如何验证授权',
    });
    expect(terms[1]).toEqual({
      localTerm: '授权描述文件',
      englishTerm: 'Authorization_Descriptor',
      definition: '存储在终端本地的加密文件',
    });
  });

  it('parses English glossary format without parenthesized terms', () => {
    const md = [
      '## Glossary',
      '',
      '- **CAP**: Control Authority Protocol',
      '- **iFay**: Independent Fay entity',
    ].join('\n');
    const terms = extractGlossaryTerms(md);
    expect(terms).toHaveLength(2);
    expect(terms[0]).toEqual({
      localTerm: 'CAP',
      englishTerm: 'CAP',
      definition: 'Control Authority Protocol',
    });
    expect(terms[1]).toEqual({
      localTerm: 'iFay',
      englishTerm: 'iFay',
      definition: 'Independent Fay entity',
    });
  });

  it('stops parsing at the next same-level heading', () => {
    const md = [
      '## 术语表',
      '- **测试（Test）**：测试定义',
      '## 第一章',
      '- **不是术语（Not_Term）**：不应被提取',
    ].join('\n');
    const terms = extractGlossaryTerms(md);
    expect(terms).toHaveLength(1);
    expect(terms[0].englishTerm).toBe('Test');
  });

  it('returns empty array when no glossary section exists', () => {
    const md = '# Title\n\nSome content without glossary.';
    expect(extractGlossaryTerms(md)).toEqual([]);
  });
});


// ---------------------------------------------------------------------------
// 3. extractBodyTerms
// ---------------------------------------------------------------------------
describe('extractBodyTerms', () => {
  it('finds PascalCase_Underscore terms in body text', () => {
    const md = [
      '# Title',
      '',
      'The Authorization_Descriptor is the core mechanism.',
      'The Trusted_Ticket provides online support.',
    ].join('\n');
    const terms = extractBodyTerms(md);
    expect(terms).toContain('Authorization_Descriptor');
    expect(terms).toContain('Trusted_Ticket');
  });

  it('skips terms inside the glossary section', () => {
    const md = [
      '# Title',
      '',
      'Body mentions Authorization_Descriptor here.',
      '',
      '## 术语表',
      '',
      'Glossary mentions Trusted_Ticket here.',
      '',
      '## Next Section',
      '',
      'Body mentions Handover_Policy here.',
    ].join('\n');
    const terms = extractBodyTerms(md);
    expect(terms).toContain('Authorization_Descriptor');
    expect(terms).toContain('Handover_Policy');
    expect(terms).not.toContain('Trusted_Ticket');
  });

  it('skips terms inside fenced code blocks', () => {
    const md = [
      '# Title',
      '',
      '```',
      'Authorization_Descriptor inside code',
      '```',
      '',
      'Trusted_Ticket outside code.',
    ].join('\n');
    const terms = extractBodyTerms(md);
    expect(terms).not.toContain('Authorization_Descriptor');
    expect(terms).toContain('Trusted_Ticket');
  });

  it('returns empty array when no matching terms exist', () => {
    const md = '# Title\n\nJust plain text with no technical terms.';
    expect(extractBodyTerms(md)).toEqual([]);
  });

  it('deduplicates repeated terms', () => {
    const md = [
      '# Title',
      'Authorization_Descriptor appears here.',
      'Authorization_Descriptor appears again.',
    ].join('\n');
    const terms = extractBodyTerms(md);
    const count = terms.filter((t) => t === 'Authorization_Descriptor').length;
    expect(count).toBe(1);
  });
});


// ---------------------------------------------------------------------------
// 4. countWords / countSummaryWords
// ---------------------------------------------------------------------------
describe('countWords', () => {
  it('counts Chinese characters as individual words', () => {
    // 6 Chinese characters: 控制权限协议
    expect(countWords('控制权限协议')).toBe(6);
  });

  it('counts English words split by whitespace', () => {
    expect(countWords('Control Authority Protocol')).toBe(3);
  });

  it('counts mixed Chinese and English content', () => {
    // 3 Chinese chars + 1 English word = 4
    expect(countWords('控制权 CAP')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('strips markdown bold formatting before counting', () => {
    expect(countWords('**bold text** here')).toBe(3);
  });

  it('strips inline code formatting before counting', () => {
    expect(countWords('use `code` here')).toBe(3);
  });

  it('strips link formatting before counting', () => {
    expect(countWords('[link text](http://example.com) end')).toBe(3);
  });
});

describe('countSummaryWords', () => {
  it('counts words between first and second heading', () => {
    const md = [
      '# Title',
      '',
      'This is the summary section.',
      '',
      '## Next Section',
      '',
      'This is not summary.',
    ].join('\n');
    // "This is the summary section." = 5 words
    expect(countSummaryWords(md)).toBe(5);
  });

  it('returns 0 when there is no content between headings', () => {
    const md = ['# Title', '## Next Section'].join('\n');
    expect(countSummaryWords(md)).toBe(0);
  });

  it('counts Chinese summary characters correctly', () => {
    const md = [
      '# 标题',
      '',
      '控制权限协议定义了终端设备',
      '',
      '## 术语表',
    ].join('\n');
    // 13 Chinese characters: 控制权限协议定义了终端设备
    expect(countSummaryWords(md)).toBe(13);
  });

  it('handles document with only one heading (summary extends to end)', () => {
    const md = ['# Title', '', 'Only one heading with some words.'].join('\n');
    // "Only one heading with some words." = 6 words
    expect(countSummaryWords(md)).toBe(6);
  });
});


// ---------------------------------------------------------------------------
// 5. extractMermaidBlocks
// ---------------------------------------------------------------------------
describe('extractMermaidBlocks', () => {
  it('extracts a single mermaid block', () => {
    const md = [
      'Some text',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      'More text',
    ].join('\n');
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain('graph TD');
    expect(blocks[0]).toContain('A --> B');
  });

  it('extracts multiple mermaid blocks', () => {
    const md = [
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '',
      '```mermaid',
      'sequenceDiagram',
      '  Alice->>Bob: Hello',
      '```',
    ].join('\n');
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('graph TD');
    expect(blocks[1]).toContain('sequenceDiagram');
  });

  it('returns empty array when no mermaid blocks exist', () => {
    const md = '# Title\n\nNo diagrams here.\n\n```js\nconsole.log("hi")\n```';
    expect(extractMermaidBlocks(md)).toEqual([]);
  });
});


// ---------------------------------------------------------------------------
// 6. sectionContains / extractSection
// ---------------------------------------------------------------------------
describe('extractSection', () => {
  it('extracts section content by heading text', () => {
    const md = [
      '# Title',
      '',
      '## Section A',
      'Content of section A.',
      '',
      '## Section B',
      'Content of section B.',
    ].join('\n');
    const section = extractSection(md, 'Section A');
    expect(section).not.toBeNull();
    expect(section).toContain('Content of section A.');
    expect(section).not.toContain('Content of section B.');
  });

  it('extracts nested subsections within a section', () => {
    const md = [
      '## Parent',
      'Parent content.',
      '### Child',
      'Child content.',
      '## Sibling',
      'Sibling content.',
    ].join('\n');
    const section = extractSection(md, 'Parent');
    expect(section).toContain('Parent content.');
    expect(section).toContain('Child content.');
    expect(section).not.toContain('Sibling content.');
  });

  it('returns null for a missing section', () => {
    const md = '# Title\n## Existing Section\nContent.';
    expect(extractSection(md, 'Nonexistent')).toBeNull();
  });

  it('supports regex patterns for heading matching', () => {
    const md = [
      '## 2.1 离线授权（Authorization_Descriptor）',
      'Offline auth content.',
      '## 2.2 在线票据',
    ].join('\n');
    const section = extractSection(md, /离线授权/);
    expect(section).not.toBeNull();
    expect(section).toContain('Offline auth content.');
  });
});

describe('sectionContains', () => {
  it('returns true when section contains the content string', () => {
    const md = [
      '## Features',
      'This section describes the read-write lock model.',
      '## Other',
    ].join('\n');
    expect(sectionContains(md, 'Features', 'read-write lock')).toBe(true);
  });

  it('returns false when section does not contain the content', () => {
    const md = [
      '## Features',
      'Some unrelated content.',
      '## Other',
    ].join('\n');
    expect(sectionContains(md, 'Features', 'nonexistent phrase')).toBe(false);
  });

  it('returns false when the section itself does not exist', () => {
    const md = '## Existing\nContent.';
    expect(sectionContains(md, 'Missing', 'anything')).toBe(false);
  });

  it('supports regex content matching', () => {
    const md = [
      '## Modes',
      'Supports read, write, execute, and configure modes.',
    ].join('\n');
    expect(sectionContains(md, 'Modes', /read.*write.*execute.*configure/)).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// 7. blueprintPath
// ---------------------------------------------------------------------------
describe('blueprintPath', () => {
  it('generates correct path for zh-CN', () => {
    expect(blueprintPath('zh-CN')).toContain('docs/zh-CN/blueprint/cap-blueprint.md');
  });

  it('generates correct path for en', () => {
    expect(blueprintPath('en')).toContain('docs/en/blueprint/cap-blueprint.md');
  });

  it('generates correct path for all supported languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const p = blueprintPath(lang);
      expect(p).toContain(`docs/${lang}/blueprint/cap-blueprint.md`);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. SUPPORTED_LANGUAGES
// ---------------------------------------------------------------------------
describe('SUPPORTED_LANGUAGES', () => {
  it('contains exactly 9 language codes', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(9);
  });

  it('includes all expected languages', () => {
    const expected = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru'];
    for (const lang of expected) {
      expect(SUPPORTED_LANGUAGES).toContain(lang);
    }
  });
});
