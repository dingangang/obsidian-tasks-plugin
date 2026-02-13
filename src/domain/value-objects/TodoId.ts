/**
 * TodoId 值对象
 * 表示待办事项的唯一标识符
 */

export class TodoId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.length === 0) {
      throw new Error('TodoId cannot be empty');
    }
    this.value = value;
  }

  /**
   * 生成新的 ID
   */
  static generate(): TodoId {
    return new TodoId(
      Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * 从字符串创建 ID
   */
  static fromString(value: string): TodoId {
    return new TodoId(value);
  }

  /**
   * 获取 ID 的字符串值
   */
  get(): string {
    return this.value;
  }

  /**
   * 判断两个 ID 是否相等
   */
  equals(other: TodoId): boolean {
    return this.value === other.value;
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * JSON 序列化
   */
  toJSON(): string {
    return this.value;
  }
}
