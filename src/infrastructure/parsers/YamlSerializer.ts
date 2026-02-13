/**
 * YAML 序列化器
 * 将待办事项数据转换为 YAML 格式
 */

import { TodoItemData } from '@/domain/types';

export class YamlSerializer {
  /**
   * 序列化单个待办事项为 YAML
   */
  private objectToYaml(todo: TodoItemData): string {
    const lines: string[] = [];

    // 处理各种值对象
    const id = this.extractValue(todo.id);
    lines.push(`id: ${this.escapeYaml(id)}`);

    const title = this.extractValue(todo.title);
    lines.push(`title: ${this.escapeYaml(title)}`);

    if (todo.description) {
      const desc = this.extractValue(todo.description);
      lines.push(`description: ${this.escapeYaml(desc)}`);
    }

    const priority = this.extractValue(todo.priority);
    lines.push(`priority: ${priority}`);

    const dates = (todo.dates as any).toObject ? (todo.dates as any).toObject() : todo.dates;
    if (dates.due) {
      lines.push(`dueDate: ${this.formatDate(dates.due)}`);
    }
    if (dates.scheduled) {
      lines.push(`scheduledDate: ${this.formatDate(dates.scheduled)}`);
    }
    if (dates.start) {
      lines.push(`startDate: ${this.formatDate(dates.start)}`);
    }
    if (dates.created) {
      lines.push(`createdAt: ${this.formatDate(dates.created)}`);
    }
    if (dates.completed) {
      lines.push(`completedAt: ${this.formatDate(dates.completed)}`);
    }
    if (dates.cancelled) {
      lines.push(`cancelledAt: ${this.formatDate(dates.cancelled)}`);
    }

    const tags = (todo.tags as any).toArray ? (todo.tags as any).toArray() : todo.tags;
    if (tags && tags.length > 0) {
      lines.push(`tags: [${tags.map((t: string) => `'${t}'`).join(', ')}]`);
    }

    const status = this.extractValue(todo.status);
    lines.push(`status: ${status}`);

    if (todo.linkedNote) {
      const note = this.extractValue(todo.linkedNote);
      lines.push(`linkedNote: ${note}`);
    }

    if (todo.timestamps) {
      lines.push(`updatedAt: ${this.formatDate(todo.timestamps.updated)}`);
    }

    return lines.join('\n');
  }

  /**
   * 序列化待办事项数组为 YAML 格式
   */
  serialize(todos: TodoItemData[]): string {
    const yamlBlocks = todos.map(todo => this.objectToYaml(todo));
    const header = `---
title: 待办事项
created: ${new Date().toISOString()}
---

`;

    return header + yamlBlocks.join('\n---\n');
  }

  /**
   * 格式化日期为 ISO 字符串
   */
  private formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * 提取值对象的原始值
   */
  private extractValue(obj: any): any {
    if (obj && typeof obj === 'object') {
      if (typeof obj.get === 'function') {
        return obj.get();
      }
      if (typeof obj.toString === 'function') {
        return obj.toString();
      }
    }
    return obj;
  }

  /**
   * 转义 YAML 特殊字符
   */
  private escapeYaml(str: string): string {
    return str.replace(/:/g, '\\:').replace(/\n/g, '\\n');
  }
}
