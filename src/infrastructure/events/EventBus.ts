/**
 * 事件总线
 * 用于发布和订阅领域事件
 */

import { DomainEvent } from '@/domain/events';

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  /**
   * 订阅事件
   * @returns 取消订阅的函数
   */
  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: EventHandler<T>
  ): () => void {
    const eventName = eventType.name;

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.handlers.get(eventName)?.delete(handler);
    };
  }

  /**
   * 发布事件
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName);

    if (!handlers) {
      return;
    }

    // 异步执行所有处理器，捕获错误
    await Promise.allSettled(
      Array.from(handlers).map((handler) => {
        try {
          return handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
          throw error;
        }
      })
    );
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.handlers.clear();
  }
}
