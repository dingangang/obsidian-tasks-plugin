/**
 * 筛选条件类型定义
 */

import { PriorityLevel } from './priority.types';

/**
 * 视图模式
 */
export enum ViewMode {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

/**
 * 筛选条件接口
 */
export interface TodoFilter {
  /** 状态筛选 */
  status?: ViewMode;
  /** 标签筛选 */
  tag?: string;
  /** 搜索关键词 */
  searchTerm?: string;
  /** 优先级筛选 */
  priority?: PriorityLevel;
  /** 是否仅显示过期 */
  isOverdue?: boolean;
}

/**
 * 排序方式枚举
 */
export enum SortBy {
  DueDate = 'dueDate',
  Priority = 'priority',
  CreatedAt = 'createdAt',
  Title = 'title',
}
