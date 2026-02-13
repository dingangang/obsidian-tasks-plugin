/**
 * TodoRepository
 * 数据访问层，管理待办事项的 CRUD 操作
 */

import { TodoItemData } from '@/domain/types';
import { ITodoStore } from '../storage/interfaces/ITodoStore';
import { EventBus } from '../events/EventBus';
import { TodoCreatedEvent, TodoUpdatedEvent, TodoDeletedEvent } from '@/domain/events';

export class TodoRepository {
  private cache: TodoItemData[] = [];

  constructor(
    private store: ITodoStore,
    private eventBus: EventBus
  ) {}

  /**
   * 初始化仓储
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
    await this.syncFromStore();
  }

  /**
   * 查找所有待办事项
   */
  async findAll(): Promise<TodoItemData[]> {
    if (this.cache.length === 0) {
      await this.syncFromStore();
    }
    return [...this.cache];
  }

  /**
   * 根据 ID 查找待办事项
   */
  async findById(id: string): Promise<TodoItemData | null> {
    const todos = await this.findAll();
    return todos.find((t) => {
      const todoId = (t.id as any).get ? (t.id as any).get() : t.id;
      return todoId === id;
    }) || null;
  }

  /**
   * 保存待办事项
   */
  async save(todo: TodoItemData): Promise<void> {
    this.updateCache(todo);
    await this.persist();

    // 发布事件
    const todoId = (todo.id as any).get ? (todo.id as any).get() : todo.id;
    await this.eventBus.publish(new TodoUpdatedEvent({ get: () => todoId } as any));
  }

  /**
   * 批量保存待办事项
   */
  async saveAll(todos: TodoItemData[]): Promise<void> {
    this.cache = [...todos];
    await this.persist();
  }

  /**
   * 删除待办事项
   */
  async delete(id: string): Promise<void> {
    this.cache = this.cache.filter((t) => {
      const todoId = (t.id as any).get ? (t.id as any).get() : t.id;
      return todoId !== id;
    });
    await this.persist();

    // 发布事件
    await this.eventBus.publish(new TodoDeletedEvent({ get: () => id } as any));
  }

  /**
   * 持久化到存储
   */
  private async persist(): Promise<void> {
    await this.store.saveAll(this.cache);
  }

  /**
   * 从存储同步
   */
  private async syncFromStore(): Promise<void> {
    const data = await this.store.readAll();
    this.cache = data;
  }

  /**
   * 更新缓存
   */
  private updateCache(todo: TodoItemData): void {
    const todoId = (todo.id as any).get ? (todo.id as any).get() : todo.id;
    const index = this.cache.findIndex((t) => {
      const cachedId = (t.id as any).get ? (t.id as any).get() : t.id;
      return cachedId === todoId;
    });

    if (index >= 0) {
      this.cache[index] = todo;
    } else {
      this.cache.push(todo);
    }
  }

  /**
   * 获取缓存数量
   */
  getCacheSize(): number {
    return this.cache.length;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache = [];
  }
}
