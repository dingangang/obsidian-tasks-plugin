/**
 * 优先级相关类型定义
 */

/**
 * 优先级等级枚举
 */
export enum PriorityLevel {
  Lowest = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Highest = 4,
}

/**
 * 优先级与 Tasks 插件 emoji 的映射
 */
export const PRIORITY_EMOJI_MAP: Record<PriorityLevel, string> = {
  [PriorityLevel.Highest]: '🔺',
  [PriorityLevel.High]: '⏫',
  [PriorityLevel.Medium]: '🔼',
  [PriorityLevel.Low]: '🔽',
  [PriorityLevel.Lowest]: '⏬',
};
