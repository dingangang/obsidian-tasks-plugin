import { Priority, TodoItem } from '../types';

/**
 * 待办事项模型类
 */
export class TodoItemModel {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  linkedNote?: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<TodoItem>) {
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.completed = data.completed || false;
    this.priority = data.priority || 'medium';
    this.dueDate = data.dueDate;
    this.tags = data.tags || [];
    this.linkedNote = data.linkedNote;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 转换为纯对象（用于存储）
   */
  toObject(): TodoItem {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      priority: this.priority,
      dueDate: this.dueDate,
      tags: this.tags,
      linkedNote: this.linkedNote,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从对象创建实例
   */
  static fromObject(data: TodoItem): TodoItemModel {
    return new TodoItemModel(data);
  }

  /**
   * 切换完成状态
   */
  toggleComplete(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 更新待办事项
   */
  update(updates: Partial<TodoItem>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 检查是否过期
   */
  isOverdue(): boolean {
    if (!this.dueDate || this.completed) return false;
    return new Date(this.dueDate) < new Date();
  }

  /**
   * 获取剩余天数
   */
  getDaysRemaining(): number | null {
    if (!this.dueDate) return null;
    const due = new Date(this.dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 克隆待办事项
   */
  clone(): TodoItemModel {
    return new TodoItemModel(this.toObject());
  }
}
