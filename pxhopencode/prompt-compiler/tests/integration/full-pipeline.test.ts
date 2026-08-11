import { describe, it, expect } from 'vitest';
import { Pipeline } from '../../src/pipeline/orchestrator.js';
import { generatePrompt } from '../../src/backends/index.js';
import type { Backend } from '../../src/types.js';

const testCases: Array<{
  name: string;
  input: string;
  expectIntents?: string[];
  expectConstraints?: string[];
  expectFrameworks?: string[];
  expectLanguages?: string[];
  expectIntentsContain?: string[];
}> = [
  {
    name: 'Vietnamese bug fix with preservation',
    input: 'sửa bug trong file UserService.ts, đừng phá code cũ, chỉ sửa đúng chỗ cần',
    expectIntents: ['fix_bug'],
    expectConstraints: ['preserve_behavior', 'minimal_changes'],
  },
  {
    name: 'Game development in English',
    input: 'Create a 2D platformer game with Phaser 3 where the player jumps over obstacles',
    expectFrameworks: ['Phaser'],
    expectIntentsContain: ['generate_game', 'generate_feature'],
  },
  {
    name: 'Web API with constraints',
    input: 'Build a REST API with Express and TypeScript. Minimal changes to existing code. No breaking changes.',
    expectIntentsContain: ['generate_api', 'generate_feature'],
    expectConstraints: ['minimal_changes', 'no_breaking_changes'],
    expectLanguages: ['TypeScript'],
  },
  {
    name: 'Mixed Vietnamese-English with technical terms',
    input: 'Fix bug trong React component, dùng TypeScript, giữ nguyên behavior',
    expectIntents: ['fix_bug'],
    expectConstraints: ['preserve_behavior'],
    expectFrameworks: ['React'],
    expectLanguages: ['TypeScript'],
  },
  {
    name: 'Security audit',
    input: 'Kiểm tra bảo mật cho API authentication module. Tìm lỗ hổng SQL injection và XSS.',
    expectIntentsContain: ['security_audit'],
  },
  {
    name: 'Performance optimization',
    input: 'Tối ưu hiệu suất game 3D với Three.js, FPS đang bị thấp',
    expectIntentsContain: ['performance_optimization'],
    expectFrameworks: ['Three.js'],
  },
  {
    name: 'Architecture with multiple constraints',
    input: 'Thiết kế architecture cho hệ thống e-commerce. Dùng React Native và TypeScript.',
    expectIntentsContain: ['architecture_design'],
    expectFrameworks: ['React Native'],
    expectLanguages: ['TypeScript'],
  },
];

describe('Full Pipeline Integration', () => {
  for (const tc of testCases) {
    it(`should process: ${tc.name}`, () => {
      const pipeline = new Pipeline({ backend: 'deepseek' });
      const result = pipeline.compile(tc.input);

      if (tc.expectIntents) {
        for (const intent of tc.expectIntents) {
          expect(result.ir.intents).toContain(intent);
        }
      }

      if (tc.expectIntentsContain) {
        const hasSome = tc.expectIntentsContain.some(i => result.ir.intents.includes(i));
        expect(hasSome).toBe(true);
      }

      if (tc.expectConstraints) {
        for (const constraint of tc.expectConstraints) {
          expect(result.ir.constraints).toContain(constraint);
        }
      }

      if (tc.expectFrameworks) {
        for (const fw of tc.expectFrameworks) {
          expect(result.ir.target.frameworks).toContain(fw);
        }
      }

      if (tc.expectLanguages) {
        for (const lang of tc.expectLanguages) {
          expect(result.ir.target.languages).toContain(lang);
        }
      }

      expect(result.metrics.totalMs).toBeGreaterThan(0);
      expect(result.metrics.stages.length).toBe(10);
      expect(result.prompt.length).toBeGreaterThan(10);
    });
  }

  it('should produce consistent output across all backends', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Fix the authentication bug in TypeScript');
    const backends: Backend[] = ['deepseek', 'claude', 'gpt', 'gemini', 'opencode', 'codex'];

    for (const backend of backends) {
      const prompt = generatePrompt(result.ir, backend);
      expect(prompt.length).toBeGreaterThan(20);
    }
  });

  it('should preserve a concrete target for the OpenCode backend when intent is unknown', () => {
    const input = 'Make the dashboard navigation easier to use on mobile';
    const result = new Pipeline({ backend: 'opencode' }).compile(input);
    expect(result.prompt).toContain('RULE:');
    expect(result.prompt).toContain('TARGET:');
    expect(result.prompt.toLowerCase()).toContain('dashboard navigation');
  });

  it('should not normalize short technical terms inside ordinary words', () => {
    const result = new Pipeline({ backend: 'opencode' }).compile('Make a dashboard with a clear navigation');
    expect(result.ir.normalized).toContain('dashboard');
    expect(result.ir.normalized).not.toContain('dashboARd');
  });

  it('should handle very long input without crashing', () => {
    const longInput = Array(10).fill('Fix the bug in the login component with TypeScript. Preserve existing behavior. No breaking changes. Only modify the login handler.').join(' ');
    const pipeline = new Pipeline();
    const result = pipeline.compile(longInput);
    expect(result.ir.intents.length).toBeGreaterThan(0);
    expect(result.metrics.totalMs).toBeLessThan(2000);
  });

  it('should handle input with code blocks', () => {
    const input = 'Review this code:\n```typescript\nfunction add(a: number, b: number) {\n  return a + b;\n}\n```\nIs this correct?';
    const pipeline = new Pipeline();
    const result = pipeline.compile(input);
    expect(result.ir.intents.length).toBeGreaterThan(0);
    expect(result.prompt.length).toBeGreaterThan(10);
  });

  it('should strip filler words effectively', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Hãy giúp tôi vui lòng fix bug trong login component. Cảm ơn bạn.');
    const hasFiller = result.ir.normalized.includes('hãy') || result.ir.normalized.includes('giúp');
    expect(hasFiller).toBe(false);
  });

  it('should compress normalized output compared to raw input', () => {
    const pipeline = new Pipeline({ optimizationLevel: 2 });
    const result = pipeline.compile('Hãy giúp tôi sửa bug trong component login. Vui lòng giữ nguyên hành vi cũ. Không được làm hỏng code đang chạy. Chỉ sửa trong file Login.tsx thôi nhé.');
    expect(result.ir.normalized.length).toBeLessThan(result.ir.raw.length);
  });
});
