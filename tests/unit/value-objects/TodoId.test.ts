import { describe, it, expect } from 'vitest';
import { TodoId } from '../../../src/domain/value-objects/TodoId';

describe('TodoId', () => {
  it('应该生成唯一的 ID', () => {
    const id1 = TodoId.generate();
    const id2 = TodoId.generate();

    expect(id1.equals(id2)).toBe(false);
    expect(id1.get()).not.toBe(id2.get());
  });

  it('应该从字符串创建 ID', () => {
    const id = TodoId.fromString('test-id-123');

    expect(id.get()).toBe('test-id-123');
  });

  it('空字符串应该抛出错误', () => {
    expect(() => new TodoId('')).toThrow();
  });

  it('应该正确判断相等', () => {
    const id1 = TodoId.fromString('same-id');
    const id2 = TodoId.fromString('same-id');

    expect(id1.equals(id2)).toBe(true);
  });
});
