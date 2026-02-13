/**
 * YAML 反序列化器
 * 将 YAML 格式转换为待办事项数据
 */

import { TodoItemData } from '@/domain/types';
import { TodoId } from '@/domain/value-objects/TodoId';
import { Title } from '@/domain/value-objects/Title';
import { Description } from '@/domain/value-objects/Description';
import { Priority } from '@/domain/value-objects/Priority';
import { TodoTags } from '@/domain/value-objects/TodoTags';
import { TodoStatus } from '@/domain/value-objects/TodoStatus';
import { NotePath } from '@/domain/value-objects/NotePath';

export class YamlDeserializer {
  /**
   * 反序列化 YAML 内容为待办事项数组
   */
  deserialize(content: string): TodoItemData[] {
    const todos: TodoItemData[] = [];
    const blocks = content.split(/\r?\n---\r?\n/);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed || !trimmed.includes('id:') || !trimmed.includes('title:')) {
        continue;
      }

      try {
        const todo = this.yamlToObject(trimmed);
        if (todo) {
          todos.push(todo);
        }
      } catch (error) {
        console.error('Failed to parse YAML block:', error);
      }
    }

    return todos;
  }

  /**
   * 解析 YAML 块为待办事项数据
   */
  private yamlToObject(yaml: string): TodoItemData | null {
    const lines = yaml.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, colonIndex).trim();
      let value: any = trimmed.substring(colonIndex + 1).trim();

      // 处理值
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // 数组
        const inner = value.slice(1, -1);
        value = this.parseArray(inner);
      }

      result[key] = this.unescapeYaml(value);
    }

    // 验证必需字段
    if (!result.title) {
      return null;
    }

    // 转换为值对象
    try {
      return {
        id: TodoId.fromString(result.id || TodoId.generate().get()),
        title: Title.fromString(result.title),
        description: result.description ? Description.fromString(result.description) : undefined,
        priority: Priority.fromString(result.priority || 'medium'),
        dates: this.parseDates(result),
        tags: TodoTags.fromArray(result.tags || []),
        status: TodoStatus.fromString(result.status || 'active'),
        linkedNote: result.linkedNote ? NotePath.fromString(result.linkedNote) : undefined,
        timestamps: {
          created: result.createdAt ? new Date(result.createdAt) : new Date(),
          updated: result.updatedAt ? new Date(result.updatedAt) : new Date(),
        },
      };
    } catch (error) {
      console.error('Failed to create value objects:', error);
      return null;
    }
  }

  /**
   * 解析日期字段
   */
  private parseDates(data: Record<string, any>): any {
    const dates: any = {};

    if (data.dueDate) {
      dates.due = new Date(data.dueDate);
    }
    if (data.scheduledDate) {
      dates.scheduled = new Date(data.scheduledDate);
    }
    if (data.startDate) {
      dates.start = new Date(data.startDate);
    }
    if (data.createdAt) {
      dates.created = new Date(data.createdAt);
    }
    if (data.completedAt) {
      dates.completed = new Date(data.completedAt);
    }
    if (data.cancelledAt) {
      dates.cancelled = new Date(data.cancelledAt);
    }

    return dates;
  }

  /**
   * 解析数组
   */
  private parseArray(str: string): string[] {
    if (!str || str.trim().length === 0) {
      return [];
    }
    return str
      .split(',')
      .map((s: string) => {
        const trimmed = s.trim().replace(/^['"]|['"]$/g, '');
        return trimmed;
      })
      .filter((s: string) => Boolean(s));
  }

  /**
   * 反转义 YAML 字符串
   */
  private unescapeYaml(val: any): any {
    if (typeof val !== 'string') {
      return val;
    }
    return val.replace(/\\:/g, ':').replace(/\\n/g, '\n');
  }
}
