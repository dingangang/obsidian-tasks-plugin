/**
 * TodoItem 实体
 * 表示待办事项的领域模型
 */

import { TodoItemData, TodoDates, TodoStatistics } from '../types';
import { TodoId } from '../value-objects/TodoId';
import { Title } from '../value-objects/Title';
import { Description } from '../value-objects/Description';
import { Priority } from '../value-objects/Priority';
import { TodoTags } from '../value-objects/TodoTags';
import { TodoStatus } from '../value-objects/TodoStatus';
import { NotePath } from '../value-objects/NotePath';

export class TodoItem {
  private readonly data: TodoItemData;

  private constructor(data: TodoItemData) {
    this.data = data;
  }

  /**
   * 创建新的待办事项
   */
  static create(data: {
    id: TodoId;
    title: Title;
    description?: Description;
    priority: Priority;
    dates: any;
    tags: TodoTags;
    status: TodoStatus;
    linkedNote?: NotePath;
    timestamps: { created: Date; updated: Date };
  }): TodoItem {
    return new TodoItem({
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dates: data.dates,
      tags: data.tags,
      status: data.status,
      linkedNote: data.linkedNote,
      timestamps: data.timestamps,
    });
  }

  /**
   * 从数据对象创建实体
   */
  static fromData(data: TodoItemData): TodoItem {
    return new TodoItem(data);
  }

  // ========== Getters ==========

  get id(): TodoId {
    return this.data.id;
  }

  get title(): Title {
    return this.data.title;
  }

  get description(): Description | undefined {
    return this.data.description;
  }

  get priority(): Priority {
    return this.data.priority;
  }

  get dates(): TodoDates {
    return this.data.dates as any; // 临时转换
  }

  get tags(): TodoTags {
    return this.data.tags;
  }

  get status(): TodoStatus {
    return this.data.status;
  }

  get linkedNote(): NotePath | undefined {
    return this.data.linkedNote;
  }

  get timestamps(): { created: Date; updated: Date } {
    return this.data.timestamps;
  }

  // ========== 业务方法 ==========

  /**
   * 完成待办事项
   */
  complete(): TodoItem {
    if (this.data.status.isCompleted()) {
      return this;
    }
    return new TodoItem({
      ...this.data,
      status: this.data.status.completed ? this.data.status.completed() : this.data.status,
      timestamps: {
        ...this.data.timestamps,
        updated: new Date(),
      },
    });
  }

  /**
   * 激活待办事项（从完成状态恢复）
   */
  activate(): TodoItem {
    if (this.data.status.isActive()) {
      return this;
    }
    return new TodoItem({
      ...this.data,
      status: this.data.status.active ? this.data.status.active() : this.data.status,
      timestamps: {
        ...this.data.timestamps,
        updated: new Date(),
      },
    });
  }

  /**
   * 判断是否已完成
   */
  isCompleted(): boolean {
    return this.data.status.isCompleted();
  }

  /**
   * 判断是否活跃
   */
  isActive(): boolean {
    return this.data.status.isActive();
  }

  /**
   * 判断是否过期
   */
  isOverdue(): boolean {
    const due = (this.data.dates as any).due;
    if (!due || this.isCompleted()) {
      return false;
    }
    return due < new Date();
  }

  /**
   * 获取剩余天数
   */
  getDaysRemaining(): number | null {
    const due = (this.data.dates as any).due;
    if (!due) return null;
    const diff = due.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 判断是否包含指定标签
   */
  hasTag(tag: string): boolean {
    return this.data.tags.has ? this.data.tags.has(tag) : false;
  }

  /**
   * 判断是否匹配搜索关键词
   */
  matchesSearch(query: string): boolean {
    const q = query.toLowerCase();
    return (
      this.data.title.get ? this.data.title.get().toLowerCase().includes(q) : false ||
      this.data.description?.get ? this.data.description.get().toLowerCase().includes(q) : false
    );
  }

  // ========== 不可变更新方法 ==========

  /**
   * 更新标题
   */
  withTitle(title: Title): TodoItem {
    return new TodoItem({
      ...this.data,
      title,
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  /**
   * 更新描述
   */
  withDescription(description: Description): TodoItem {
    return new TodoItem({
      ...this.data,
      description,
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  /**
   * 更新优先级
   */
  withPriority(priority: Priority): TodoItem {
    return new TodoItem({
      ...this.data,
      priority,
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  /**
   * 更新日期
   */
  withDates(dates: TodoDates): TodoItem {
    return new TodoItem({
      ...this.data,
      dates: dates.toObject(),
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  /**
   * 更新标签
   */
  withTags(tags: TodoTags): TodoItem {
    return new TodoItem({
      ...this.data,
      tags,
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  /**
   * 更新关联笔记
   */
  withLinkedNote(notePath: NotePath): TodoItem {
    return new TodoItem({
      ...this.data,
      linkedNote: notePath,
      timestamps: { ...this.data.timestamps, updated: new Date() },
    });
  }

  // ========== 数据导出 ==========

  /**
   * 转换为数据对象
   */
  toData(): TodoItemData {
    return this.data;
  }

  /**
   * 转换为序列化对象（用于存储）
   */
  toObject(): any {
    return {
      id: this.data.id.get ? this.data.id.get() : this.data.id,
      title: this.data.title.get ? this.data.title.get() : this.data.title,
      description: this.data.description?.get ? this.data.description.get() : this.data.description,
      priority: this.data.priority.toString ? this.data.priority.toString() : this.data.priority,
      dates: this.data.dates.toObject ? this.data.dates.toObject() : this.data.dates,
      tags: this.data.tags.toArray ? this.data.tags.toArray() : this.data.tags,
      status: this.data.status.toString ? this.data.status.toString() : this.data.status,
      linkedNote: this.data.linkedNote?.get ? this.data.linkedNote.get() : this.data.linkedNote,
      timestamps: this.data.timestamps,
    };
  }
}
