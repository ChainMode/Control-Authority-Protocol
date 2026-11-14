import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

/**
 * Supported language codes for the CAP blueprint.
 */
export const SUPPORTED_LANGUAGES = [
  'zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru',
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Returns the file path for a blueprint document given a language code.
 */
export function blueprintPath(lang: Language): string {
  return resolve(process.cwd(), `docs/${lang}/blueprint/cap-blueprint.md`);
}

/**
 * Reads a blueprint file and returns its content, or null if it doesn't exist.
 */
export function readBlueprint(lang: Language): string | null {
  const filePath = blueprintPath(lang);
  if (existsSync(filePath)) return readFileSync(filePath, 'utf-8');

  const splitDir = resolve(process.cwd(), `docs/${lang}/blueprint`);
  if (!existsSync(splitDir)) return null;

  const parts = readdirSync(splitDir)
    .filter((name) => /^\d{2}-.+\.md$/.test(name))
    .sort()
    .map((name) => {
      const content = readFileSync(resolve(splitDir, name), 'utf-8');
      return content.replace(/^# (.+)$/m, '## $1');
    });

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/** Represents a heading extracted from Markdown. */
export interface Heading {
  level: number;
  text: string;
}

/**
 * Extracts all headings from a Markdown string.
 * Returns an array of { level, text } objects.
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Track fenced code blocks to avoid matching headings inside them
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }

  return headings;
}

/** Represents a glossary term entry. */
export interface GlossaryTerm {
  englishTerm: string;
  localTerm: string;
  definition: string;
}

/**
 * Extracts terms from the glossary section of a Markdown document.
 * Looks for a section whose heading contains common glossary keywords,
 * then parses list items in the format: **LocalTerm（English_Term）**：Definition
 * or **English_Term**：Definition
 */
export function extractGlossaryTerms(markdown: string): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  const lines = markdown.split('\n');

  // Find the glossary section
  let inGlossary = false;
  let glossaryLevel = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (inGlossary && level <= glossaryLevel) {
        // We've left the glossary section
        break;
      }

      // Detect glossary heading (术语表, Glossary, 用語集, 용어집, Glossaire, Glossar, Glosario, Глоссарий)
      if (/术语表|術語表|Glossary|用語集|용어집|Glossaire|Glossar|Glosario|Глоссарий/i.test(text)) {
        inGlossary = true;
        glossaryLevel = level;
        continue;
      }
    }

    if (!inGlossary) continue;

    // Parse glossary list items
    // Pattern: - **Term（English_Term）**：Definition
    // or: - **English_Term**: Definition
    const termMatch = line.match(
      /^[-*]\s+\*\*(.+?)\*\*[：:]\s*(.+)$/
    );
    if (termMatch) {
      const termPart = termMatch[1];
      const definition = termMatch[2].trim();

      // Try to extract English term from parentheses
      const parenMatch = termPart.match(/(.+?)[（(]([A-Za-z_]+(?:\s+[A-Za-z_]+)*)[）)]/);
      if (parenMatch) {
        terms.push({
          localTerm: parenMatch[1].trim(),
          englishTerm: parenMatch[2].trim(),
          definition,
        });
      } else {
        // The term itself might be the English term
        terms.push({
          localTerm: termPart.trim(),
          englishTerm: termPart.trim(),
          definition,
        });
      }
    }
  }

  return terms;
}


/**
 * Extracts all English technical terms referenced in the document body.
 * Matches patterns like `English_Term` (with underscores, PascalCase identifiers)
 * that appear in the body text (outside the glossary section).
 */
export function extractBodyTerms(markdown: string): string[] {
  const terms = new Set<string>();
  const lines = markdown.split('\n');

  let inGlossary = false;
  let glossaryLevel = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (inGlossary && level <= glossaryLevel) {
        inGlossary = false;
      }

      if (/术语表|術語表|Glossary|用語集|용어집|Glossaire|Glossar|Glosario|Глоссарий/i.test(text)) {
        inGlossary = true;
        glossaryLevel = level;
        continue;
      }
    }

    if (inGlossary) continue;

    // Match English technical terms with underscores (e.g., Authorization_Descriptor)
    const matches = line.matchAll(/\b([A-Z][a-z]+(?:_[A-Z][a-z]+)+)\b/g);
    for (const match of matches) {
      terms.add(match[1]);
    }
  }

  return Array.from(terms);
}

/**
 * Counts the word count of the summary/abstract section.
 * - Chinese/Japanese characters: each character counts as 1 word
 * - Other languages: split by whitespace and count words
 *
 * The summary is the content between the first heading and the second heading.
 */
export function countSummaryWords(markdown: string): number {
  const lines = markdown.split('\n');
  let foundFirstHeading = false;
  let summaryLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const isHeading = /^#{1,6}\s+/.test(line);

    if (isHeading) {
      if (!foundFirstHeading) {
        foundFirstHeading = true;
        continue;
      } else {
        // Reached the second heading — summary section ends
        break;
      }
    }

    if (foundFirstHeading) {
      summaryLines.push(line);
    }
  }

  const summaryText = summaryLines.join('\n').trim();
  if (!summaryText) return 0;

  return countWords(summaryText);
}

/**
 * Counts words in a text string.
 * - CJK characters (Chinese, Japanese Kanji): each character = 1 word
 * - Other text: split by whitespace
 */
export function countWords(text: string): number {
  // Remove markdown formatting
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/`(.+?)`/g, '$1')         // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .trim();

  if (!cleaned) return 0;

  let count = 0;

  // Match CJK characters (Chinese, Japanese Kanji, Korean Hanja)
  const cjkChars = cleaned.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (cjkChars) {
    count += cjkChars.length;
  }

  // Remove CJK characters and count remaining words by whitespace
  const nonCjk = cleaned.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').trim();
  if (nonCjk) {
    const words = nonCjk.split(/\s+/).filter((w) => w.length > 0);
    // Filter out pure punctuation tokens
    const realWords = words.filter((w) => /[a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0400-\u04ff\u00c0-\u024f]/.test(w));
    count += realWords.length;
  }

  return count;
}

/**
 * Extracts all Mermaid code blocks from a Markdown document.
 * Returns an array of Mermaid diagram source strings.
 */
export function extractMermaidBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

/**
 * Checks if a specific section (identified by heading text pattern) contains
 * the given content string.
 *
 * @param markdown - The full Markdown document
 * @param headingPattern - A regex or string to match the section heading
 * @param content - The content string to search for within the section
 * @returns true if the content exists in the matched section
 */
export function sectionContains(
  markdown: string,
  headingPattern: string | RegExp,
  content: string | RegExp
): boolean {
  const sectionContent = extractSection(markdown, headingPattern);
  if (sectionContent === null) return false;

  if (typeof content === 'string') {
    return sectionContent.includes(content);
  }
  return content.test(sectionContent);
}

/**
 * Extracts the content of a section identified by its heading.
 * Returns all content from the matched heading until the next heading of equal or higher level.
 */
export function extractSection(
  markdown: string,
  headingPattern: string | RegExp
): string | null {
  const lines = markdown.split('\n');
  let capturing = false;
  let captureLevel = 0;
  const captured: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (capturing) captured.push(line);
      continue;
    }

    if (inCodeBlock) {
      if (capturing) captured.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (capturing && level <= captureLevel) {
        break;
      }

      const pattern =
        typeof headingPattern === 'string'
          ? new RegExp(headingPattern)
          : headingPattern;

      if (!capturing && pattern.test(text)) {
        capturing = true;
        captureLevel = level;
        captured.push(line);
        continue;
      }
    }

    if (capturing) {
      captured.push(line);
    }
  }

  return capturing ? captured.join('\n') : null;
}
