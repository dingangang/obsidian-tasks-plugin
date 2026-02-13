/**
 * TodoStatus 值对象
 * 表示待办事项的状态
 */

import { TodoStatusType } from '../types/todo.types';

export class TodoStatus {
  private readonly type: TodoStatusType;

  constructor(type: TodoStatusType) {
    this.type = type;
  }

  /**
   * 创建活跃状态
   */
  static active(): TodoStatus {
    return new TodoStatus(TodoStatusType.Active);
  }

  /**
   * 创建完成状态
   */
  static completed(): TodoStatus {
    return new TodoStatus(TodoStatusType.Completed);
  }

  /**
   * 创建取消状态
   */
  static cancelled(): TodoStatus {
    return new TodoStatus(TodoStatusType.Cancelled);
  }

  /**
   * 从字符串创建状态
   */
  static fromString(str: string): TodoStatus {
    const map: Record<string, TodoStatus> = {
      'active': TodoStatus.active(),
      'completed': TodoStatus.completed(),
      'cancelled': TodoStatus.cancelled(),
    };
    return map[str.toLowerCase()] || TodoStatus.active();
  }

  /**
   * 获取状态类型
   */
  getType(): TodoStatusType {
    return this.type;
  }

  /**
   * 判断是否为活跃状态
   */
  isActive(): boolean {
    return this.type === TodoStatusType.Active;
  }

  /**
   * 判断是否为完成状态
   */
  isCompleted(): boolean {
    return this.type === TodoStatusType.Completed;
  }

  /**
   * 判断是否为取消状态
   */
  isCancelled(): boolean {
    return this.type === TodoStatusType.Cancelled;
  }

  /**
   * 判断是否相等
   */
  equals(other: TodoStatus): boolean {
    return this.type === other.type;
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.type;
  }

  /**
   * JSON 序列化
   */
  toJSON(): string {
    return this.type;
  }
}
