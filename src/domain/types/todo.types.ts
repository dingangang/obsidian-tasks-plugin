/**
 * 待办事项数据模型接口
 * 定义领域层使用的数据结构
 */

/**
 * 待办事项数据接口
 * 用于在领域层和应用层之间传递数据
 */
export interface TodoItemData {
  id: any; // TodoId (循环引用，使用 any)
  title: any; // Title
  description?: any; // Description
  priority: any; // Priority
  dates: any; // TodoDates (使用 any 避免循环引用)
  tags: any; // TodoTags
  status: any; // TodoStatus
  linkedNote?: any; // NotePath
  timestamps: Timestamps;
}

/**
 * 日期集合接口
 */
export interface TodoDates {
  /** 截止日期 */
  due?: Date;
  /** 计划日期 */
  scheduled?: Date;
  /** 开始日期 */
  start?: Date;
  /** 创建日期 */
  created: Date;
  /** 完成日期 */
  completed?: Date;
  /** 取消日期 */
  cancelled?: Date;

  /** 转换为普通对象 */
  toObject(): {
    due?: Date;
    scheduled?: Date;
    start?: Date;
    created?: Date;
    completed?: Date;
    cancelled?: Date;
  };
}

/**
 * 状态类型枚举
 */
export enum TodoStatusType {
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/**
 * 时间戳接口
 */
export interface Timestamps {
  /** 创建时间 */
  created: Date;
  /** 更新时间 */
  updated: Date;
}

/**
 * 统计信息接口
 */
export interface TodoStatistics {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  completionRate: number;
}
