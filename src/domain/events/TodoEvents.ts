/**
 * 领域事件定义
 * 表示领域内发生的重要事件
 */

import { TodoId } from '../value-objects/TodoId';

/**
 * 领域事件基类
 */
export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();
  readonly eventId: string = Math.random().toString(36).substr(2, 9);
}

/**
 * 待办事项已创建事件
 */
export class TodoCreatedEvent extends DomainEvent {
  constructor(public readonly todoId: TodoId) {
    super();
  }

  getEventName(): string {
    return 'TodoCreated';
  }
}

/**
 * 待办事项已更新事件
 */
export class TodoUpdatedEvent extends DomainEvent {
  constructor(public readonly todoId: TodoId) {
    super();
  }

  getEventName(): string {
    return 'TodoUpdated';
  }
}

/**
 * 待办事项已删除事件
 */
export class TodoDeletedEvent extends DomainEvent {
  constructor(public readonly todoId: TodoId) {
    super();
  }

  getEventName(): string {
    return 'TodoDeleted';
  }
}

/**
 * 待办事项状态已切换事件
 */
export class TodoStatusToggledEvent extends DomainEvent {
  constructor(
    public readonly todoId: TodoId,
    public readonly fromStatus: string,
    public readonly toStatus: string
  ) {
    super();
  }

  getEventName(): string {
    return 'TodoStatusToggled';
  }
}

/**
 * 待办事项已完成事件
 */
export class TodoCompletedEvent extends DomainEvent {
  constructor(
    public readonly todoId: TodoId,
    public readonly completedAt: Date
  ) {
    super();
  }

  getEventName(): string {
    return 'TodoCompleted';
  }
}
