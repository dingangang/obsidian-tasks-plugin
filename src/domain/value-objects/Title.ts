/**
 * Title 值对象
 * 表示待办事项的标题
 */

export class Title {
  private readonly MAX_LENGTH = 500;
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`Title cannot exceed ${this.MAX_LENGTH} characters`);
    }
    this.value = trimmed;
  }

  /**
   * 从字符串创建标题
   */
  static fromString(value: string): Title {
    return new Title(value);
  }

  /**
   * 获取标题的字符串值
   */
  get(): string {
    return this.value;
  }

  /**
   * 获取标题长度
   */
  length(): number {
    return this.value.length;
  }

  /**
   * 判断两个标题是否相等
   */
  equals(other: Title): boolean {
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
