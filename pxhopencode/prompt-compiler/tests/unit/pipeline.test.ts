import { describe, it, expect } from 'vitest';
import { Pipeline } from '../../src/pipeline/orchestrator.js';

describe('Pipeline', () => {
  it('should process a simple English prompt', () => {
    const pipeline = new Pipeline({ backend: 'deepseek' });
    const result = pipeline.compile('Fix the bug in the login component');
    expect(result.ir.intents).toContain('fix_bug');
    expect(result.prompt.length).toBeGreaterThan(0);
    expect(result.metrics.totalMs).toBeGreaterThan(0);
    expect(result.metrics.stages.length).toBe(10);
  });

  it('should process a Vietnamese prompt', () => {
    const pipeline = new Pipeline({ backend: 'claude' });
    const result = pipeline.compile('sửa bug trong component login, đừng phá code cũ');
    expect(result.ir.intents).toContain('fix_bug');
    expect(result.ir.constraints).toContain('preserve_behavior');
    expect(result.prompt.length).toBeGreaterThan(0);
  });

  it('should process a game development prompt', () => {
    const pipeline = new Pipeline({ backend: 'deepseek' });
    const result = pipeline.compile('Làm game platformer 2D với Phaser 3, nhân vật mèo nhảy qua chướng ngại vật');
    expect(result.ir.intents).toContain('generate_game');
    expect(result.ir.target.frameworks).toContain('Phaser');
    expect(result.ir.target.platforms.length).toBeGreaterThanOrEqual(0);
  });

  it('should process a web development prompt', () => {
    const pipeline = new Pipeline({ backend: 'gpt' });
    const result = pipeline.compile('Build a React frontend with TypeScript and Tailwind CSS');
    expect(result.ir.target.frameworks).toContain('React');
    expect(result.ir.target.languages).toContain('TypeScript');
  });

  it('should extract constraints from prompts', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Refactor this code. Minimal changes only. No breaking changes.');
    expect(result.ir.constraints).toContain('minimal_changes');
    expect(result.ir.constraints).toContain('no_breaking_changes');
  });

  it('should detect technical terms', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Build a Three.js 3D game with Cannon-es physics');
    expect(result.ir.target.frameworks).toContain('Three.js');
  });

  it('should handle security audit intent', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Security audit of the authentication module');
    expect(result.ir.intents).toContain('security_audit');
  });

  it('should handle performance optimization', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Tối ưu hiệu năng cho game, FPS đang bị chậm');
    expect(result.ir.intents).toContain('performance_optimization');
  });

  it('should set correct priority for critical constraints', () => {
    const pipeline = new Pipeline();
    const result = pipeline.compile('Fix this but preserve behavior and no breaking changes');
    expect(result.ir.priority).toBe('critical');
  });

  it('should handle empty input gracefully', () => {
    const pipeline = new Pipeline();
    expect(() => pipeline.compile('')).toThrow('empty input');
  });

  it('should compress normalized output compared to raw input', () => {
    const pipeline = new Pipeline();
    const longInput = 'Hãy giúp tôi fix bug trong component login. Vui lòng giữ nguyên hành vi cũ. Không được làm hỏng code đang chạy. Chỉ sửa trong file Login.tsx thôi nhé. Cảm ơn bạn.';
    const result = pipeline.compile(longInput);
    expect(result.ir.normalized.length).toBeLessThan(result.ir.raw.length);
  });
});
