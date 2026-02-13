/**
 * NotePath 值对象
 * 表示关联笔记的路径
 */

export class NotePath {
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('NotePath cannot be empty');
    }
    this.value = trimmed;
  }

  /**
   * 从字符串创建笔记路径
   */
  static fromString(value: string): NotePath {
    return new NotePath(value);
  }

  /**
   * 创建可选笔记路径（允许空字符串）
   */
  static fromStringOrUndefined(value: string | undefined): NotePath | undefined {
    if (!value || value.trim().length === 0) {
      return undefined;
    }
    return new NotePath(value);
  }

  /**
   * 获取路径的字符串值
   */
  get(): string {
    return this.value;
  }

  /**
   * 获取文件名
   */
  getFileName(): string {
    const parts = this.value.split('/');
    return parts[parts.length - 1];
  }

  /**
   * 判断两个路径是否相等
   */
  equals(other: NotePath): boolean {
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
