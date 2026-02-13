/**
 * TodoDates 值对象
 * 表示待办事项的日期集合
 */

export enum DateType {
  Due = 'due',
  Scheduled = 'scheduled',
  Start = 'start',
  Created = 'created',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export class TodoDates {
  private readonly dates: Map<DateType, Date>;

  constructor(dates: Partial<Record<DateType, Date>>) {
    const map = new Map<DateType, Date>();
    for (const [type, date] of Object.entries(dates)) {
      if (date) {
        map.set(type as DateType, date);
      }
    }
    this.dates = map;
  }

  /**
   * 创建只有创建日期的集合
   */
  static withCreated(created: Date): TodoDates {
    return new TodoDates({ [DateType.Created]: created });
  }

  /**
   * 创建完整的日期集合
   */
  static create(data: {
    due?: Date;
    scheduled?: Date;
    start?: Date;
    created: Date;
    completed?: Date;
    cancelled?: Date;
  }): TodoDates {
    return new TodoDates(data as Record<DateType, Date>);
  }

  /**
   * 获取截止日期
   */
  getDue(): Date | undefined {
    return this.dates.get(DateType.Due);
  }

  /**
   * 设置截止日期
   */
  withDue(due: Date): TodoDates {
    return new TodoDates({
      ...this.toObject(),
      due,
    });
  }

  /**
   * 获取计划日期
   */
  getScheduled(): Date | undefined {
    return this.dates.get(DateType.Scheduled);
  }

  /**
   * 获取开始日期
   */
  getStart(): Date | undefined {
    return this.dates.get(DateType.Start);
  }

  /**
   * 获取创建日期
   */
  getCreated(): Date | undefined {
    return this.dates.get(DateType.Created);
  }

  /**
   * 获取完成日期
   */
  getCompleted(): Date | undefined {
    return this.dates.get(DateType.Completed);
  }

  /**
   * 设置完成日期
   */
  withCompleted(completed: Date): TodoDates {
    return new TodoDates({
      ...this.toObject(),
      completed,
    });
  }

  /**
   * 转换为普通对象
   */
  toObject(): {
    due?: Date;
    scheduled?: Date;
    start?: Date;
    created?: Date;
    completed?: Date;
    cancelled?: Date;
  } {
    return {
      due: this.dates.get(DateType.Due),
      scheduled: this.dates.get(DateType.Scheduled),
      start: this.dates.get(DateType.Start),
      created: this.dates.get(DateType.Created),
      completed: this.dates.get(DateType.Completed),
      cancelled: this.dates.get(DateType.Cancelled),
    };
  }
}
