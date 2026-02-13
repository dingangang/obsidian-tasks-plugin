/**
 * Priority 值对象
 * 表示待办事项的优先级
 */

import { PriorityLevel, PRIORITY_EMOJI_MAP } from '../types/priority.types';

export class Priority {
  private readonly level: PriorityLevel;

  constructor(level: PriorityLevel) {
    this.level = level;
  }

  /**
   * 获取最高优先级
   */
  static highest(): Priority {
    return new Priority(PriorityLevel.Highest);
  }

  /**
   * 获取高优先级
   */
  static high(): Priority {
    return new Priority(PriorityLevel.High);
  }

  /**
   * 获取中优先级（默认）
   */
  static medium(): Priority {
    return new Priority(PriorityLevel.Medium);
  }

  /**
   * 获取低优先级
   */
  static low(): Priority {
    return new Priority(PriorityLevel.Low);
  }

  /**
   * 获取最低优先级
   */
  static lowest(): Priority {
    return new Priority(PriorityLevel.Lowest);
  }

  /**
   * 从字符串创建优先级
   */
  static fromString(str: string): Priority {
    const map: Record<string, Priority> = {
      'highest': Priority.highest(),
      'high': Priority.high(),
      'medium': Priority.medium(),
      'low': Priority.low(),
      'lowest': Priority.lowest(),
    };
    return map[str.toLowerCase()] || Priority.medium();
  }

  /**
   * 从 Tasks 插件的 emoji 创建优先级
   */
  static fromEmoji(emoji: string): Priority | null {
    const emojiMap: Record<string, Priority> = {
      '🔺': Priority.highest(),
      '⏫': Priority.high(),
      '🔼': Priority.medium(),
      '🔽': Priority.low(),
      '⏬': Priority.lowest(),
    };
    return emojiMap[emoji] || null;
  }

  /**
   * 获取优先级等级
   */
  getLevel(): PriorityLevel {
    return this.level;
  }

  /**
   * 判断是否高于另一个优先级
   */
  isHigherThan(other: Priority): boolean {
    return this.level > other.level;
  }

  /**
   * 判断是否低于另一个优先级
   */
  isLowerThan(other: Priority): boolean {
    return this.level < other.level;
  }

  /**
   * 判断是否相等
   */
  equals(other: Priority): boolean {
    return this.level === other.level;
  }

  /**
   * 转换为 Tasks 插件的 emoji
   */
  toTasksEmoji(): string {
    return PRIORITY_EMOJI_MAP[this.level];
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    const strMap: Record<PriorityLevel, string> = {
      [PriorityLevel.Highest]: 'highest',
      [PriorityLevel.High]: 'high',
      [PriorityLevel.Medium]: 'medium',
      [PriorityLevel.Low]: 'low',
      [PriorityLevel.Lowest]: 'lowest',
    };
    return strMap[this.level];
  }

  /**
   * JSON 序列化
   */
  toJSON(): string {
    return this.toString();
  }
}
