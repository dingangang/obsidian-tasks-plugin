/**
 * 日期相关类型定义
 */

/**
 * 日期类型枚举
 */
export enum DateType {
  Due = 'due',
  Scheduled = 'scheduled',
  Start = 'start',
  Created = 'created',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/**
 * 日期范围接口
 */
export interface DateRange {
  start: Date;
  end: Date;
}
