/**
 * TodoTags 值对象
 * 表示待办事项的标签集合
 */

export class TodoTags {
  private readonly tags: readonly string[];

  constructor(tags: string[]) {
    // 去重并过滤空标签
    this.tags = Array.from(new Set(tags.filter(t => t && t.trim().length > 0)));
  }

  /**
   * 创建空标签集合
   */
  static empty(): TodoTags {
    return new TodoTags([]);
  }

  /**
   * 从数组创建标签
   */
  static fromArray(tags: string[]): TodoTags {
    return new TodoTags(tags);
  }

  /**
   * 从逗号分隔的字符串创建标签
   */
  static fromString(str: string): TodoTags {
    if (!str || str.trim().length === 0) {
      return TodoTags.empty();
    }
    const tags = str.split(',').map(t => t.trim()).filter(t => t.length > 0);
    return new TodoTags(tags);
  }

  /**
   * 判断是否包含指定标签
   */
  has(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * 添加标签
   */
  add(tag: string): TodoTags {
    if (this.has(tag)) {
      return this;
    }
    return new TodoTags([...this.tags, tag]);
  }

  /**
   * 移除标签
   */
  remove(tag: string): TodoTags {
    return new TodoTags(this.tags.filter(t => t !== tag));
  }

  /**
   * 获取标签数量
   */
  size(): number {
    return this.tags.length;
  }

  /**
   * 判断是否为空
   */
  isEmpty(): boolean {
    return this.tags.length === 0;
  }

  /**
   * 转换为数组
   */
  toArray(): string[] {
    return [...this.tags];
  }

  /**
   * 转换为逗号分隔的字符串
   */
  toString(): string {
    return this.tags.join(', ');
  }

  /**
   * 遍历标签
   */
  forEach(callback: (tag: string, index: number) => void): void {
    this.tags.forEach(callback);
  }

  /**
   * 判断是否相等
   */
  equals(other: TodoTags): boolean {
    if (this.tags.length !== other.tags.length) {
      return false;
    }
    const sorted = [...this.tags].sort();
    const otherSorted = [...other.tags].sort();
    return sorted.every((tag, i) => tag === otherSorted[i]);
  }

  /**
   * JSON 序列化
   */
  toJSON(): string[] {
    return this.toArray();
  }
}
