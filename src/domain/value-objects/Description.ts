/**
 * Description 值对象
 * 表示待办事项的描述
 */

export class Description {
  private readonly MAX_LENGTH = 5000;
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('Description cannot be empty');
    }
    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`Description cannot exceed ${this.MAX_LENGTH} characters`);
    }
    this.value = trimmed;
  }

  /**
   * 从字符串创建描述
   */
  static fromString(value: string): Description {
    return new Description(value);
  }

  /**
   * 创建可选描述（允许空字符串）
   */
  static fromStringOrUndefined(value: string | undefined): Description | undefined {
    if (!value || value.trim().length === 0) {
      return undefined;
    }
    return new Description(value);
  }

  /**
   * 获取描述的字符串值
   */
  get(): string {
    return this.value;
  }

  /**
   * 判断两个描述是否相等
   */
  equals(other: Description): boolean {
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
