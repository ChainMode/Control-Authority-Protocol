import { describe, it, expect } from 'vitest';
import {
  readBlueprint,
  extractHeadings,
  extractMermaidBlocks,
  sectionContains,
  blueprintPath,
} from './helpers';

const blueprint = readBlueprint('zh-CN')!;

describe('zh-CN 蓝图内容单元测试', () => {
  // -------------------------------------------------------------------------
  // 需求 1.1：蓝图包含 4 个必需顶层章节
  // -------------------------------------------------------------------------
  describe('需求 1.1 - 4 个必需顶层章节', () => {
    const requiredChapters = [
      '协议定位与边界',
      '核心能力矩阵',
      '版本演进路线',
      '外部集成点',
    ];

    it('蓝图包含 4 个必需顶层章节（## 级别）', () => {
      const headings = extractHeadings(blueprint);
      const h2Texts = headings
        .filter((h) => h.level === 2)
        .map((h) => h.text);

      for (const chapter of requiredChapters) {
        expect(
          h2Texts.some((t) => t.includes(chapter)),
          `缺少顶层章节: ${chapter}`
        ).toBe(true);
      }
    });

    it('蓝图还包含术语表、Schema 与交付物关系、架构概览图章节', () => {
      const headings = extractHeadings(blueprint);
      const h2Texts = headings
        .filter((h) => h.level === 2)
        .map((h) => h.text);

      expect(h2Texts.some((t) => t.includes('术语表'))).toBe(true);
      expect(h2Texts.some((t) => /Schema.*交付物/.test(t))).toBe(true);
      expect(h2Texts.some((t) => t.includes('架构概览图'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 1.2：蓝图文件使用 .md 扩展名
  // -------------------------------------------------------------------------
  describe('需求 1.2 - Markdown 格式', () => {
    it('蓝图文件路径以 .md 结尾', () => {
      const path = blueprintPath('zh-CN');
      expect(path.endsWith('.md')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 1.5：蓝图包含 Mermaid 代码块
  // -------------------------------------------------------------------------
  describe('需求 1.5 - Mermaid 架构概览图', () => {
    it('蓝图包含至少一个 Mermaid 代码块', () => {
      const blocks = extractMermaidBlocks(blueprint);
      expect(blocks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 2.2：列出 CAP 不负责的 3 项职责
  // -------------------------------------------------------------------------
  describe('需求 2.2 - CAP 不负责的职责范围', () => {
    it('蓝图列出至少 3 项 CAP 不负责的职责', () => {
      const section = sectionContains(
        blueprint,
        /不负责的职责/,
        /身份创建与管理/
      );
      expect(section).toBe(true);

      expect(
        sectionContains(blueprint, /不负责的职责/, /智能推理能力/)
      ).toBe(true);

      expect(
        sectionContains(blueprint, /不负责的职责/, /具体业务逻辑/)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 2.5：核心设计原则"离线为主、在线为辅"
  // -------------------------------------------------------------------------
  describe('需求 2.5 - 核心设计原则', () => {
    it('蓝图描述核心设计原则"离线为主、在线为辅"', () => {
      expect(
        sectionContains(blueprint, /核心设计原则/, /离线为主/)
      ).toBe(true);
      expect(
        sectionContains(blueprint, /核心设计原则/, /在线为辅/)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 6.1：两种控制权交接场景
  // -------------------------------------------------------------------------
  describe('需求 6.1 - 控制权交接场景', () => {
    it('蓝图描述 Fay 之间的控制权转移', () => {
      expect(
        sectionContains(blueprint, /控制权交接/, /Fay 之间的控制权转移/)
      ).toBe(true);
    });

    it('蓝图描述 Fay 与人类用户之间的控制权转移', () => {
      expect(
        sectionContains(
          blueprint,
          /控制权交接/,
          /Fay 与人类用户之间的控制权转移/
        )
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 6.3：原子性保证
  // -------------------------------------------------------------------------
  describe('需求 6.3 - 原子性保证', () => {
    it('蓝图描述控制权交接的原子性保证', () => {
      expect(
        sectionContains(blueprint, /原子性保证/, /最多只有一个活跃控制方/)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 7.2：读写锁模型
  // -------------------------------------------------------------------------
  describe('需求 7.2 - 读写锁模型', () => {
    it('蓝图描述读写锁（Read-Write Lock）模型', () => {
      expect(
        sectionContains(blueprint, /读写锁/, /read.*并发/)
      ).toBe(true);
    });

    it('蓝图描述 write、execute、configure 操作要求排他控制', () => {
      expect(
        sectionContains(blueprint, /读写锁/, /排他/)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 8.2：v1 排除功能
  // -------------------------------------------------------------------------
  describe('需求 8.2 - v1 排除功能', () => {
    it('蓝图列出 v1 明确排除的功能', () => {
      expect(
        sectionContains(blueprint, /v1.*排除/, /跨终端会话迁移/)
      ).toBe(true);
      expect(
        sectionContains(blueprint, /v1.*排除/, /多终端协同授权/)
      ).toBe(true);
      expect(
        sectionContains(blueprint, /v1.*排除/, /授权委托链/)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 9.1-9.4：4 个外部集成点
  // -------------------------------------------------------------------------
  describe('需求 9.1-9.4 - 4 个外部集成点', () => {
    it('蓝图描述与 iFay_Runtime 的集成（需求 9.1）', () => {
      expect(
        sectionContains(blueprint, /iFay_Runtime.*集成/, /发起控制权请求/)
      ).toBe(true);
    });

    it('蓝图描述与终端操作系统的集成（需求 9.2）', () => {
      expect(
        sectionContains(blueprint, /终端操作系统.*集成/, /资源访问控制/)
      ).toBe(true);
    });

    it('蓝图描述与硬件驱动的集成（需求 9.3）', () => {
      expect(
        sectionContains(blueprint, /硬件驱动.*集成/, /硬件/)
      ).toBe(true);
    });

    it('蓝图描述与 Registration_Authority 的集成（需求 9.4）', () => {
      expect(
        sectionContains(
          blueprint,
          /Registration_Authority.*集成/,
          /Verification_Key/
        )
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 需求 11.1：3 类核心交付物
  // -------------------------------------------------------------------------
  describe('需求 11.1 - 3 类核心交付物', () => {
    it('蓝图描述多语言协议文档', () => {
      expect(
        sectionContains(blueprint, /三类核心交付物/, /多语言协议文档/)
      ).toBe(true);
    });

    it('蓝图描述协议 Schema 定义文件', () => {
      expect(
        sectionContains(blueprint, /三类核心交付物/, /Schema 定义文件/)
      ).toBe(true);
    });

    it('蓝图描述各语言 SDK 实现', () => {
      expect(
        sectionContains(blueprint, /三类核心交付物/, /SDK/)
      ).toBe(true);
    });
  });
});
