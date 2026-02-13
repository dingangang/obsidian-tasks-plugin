/**
 * Tasks 插件格式解析工具
 * 参考: https://github.com/obsidian-tasks-group/obsidian-tasks
 */

// Tasks 插件使用的 emoji 符号
export const TASKS_SYMBOLS = {
  priority: {
    highest: '🔺',
    high: '⏫',
    medium: '🔼',
    low: '🔽',
    lowest: '⏬',
  },
  dates: {
    due: '📅',
    scheduled: '⏳',
    start: '🛫',
    created: '➕',
    done: '✅',
    cancelled: '❌',
  },
  other: {
    recurrence: '🔁',
    dependsOn: '⛔',
    id: '🆔',
  },
} as const;

// 日期格式正则
const DATE_REGEX = /(\d{4}-\d{2}-\d{2})/;

// 各种 Tasks 字段的正则表达式
export const TASKS_REGEXES = {
  priority: /([🔺⏫🔼🔽⏬])\uFE0F?/u,
  dueDate: /[📅📆🗓]\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  scheduledDate: /[⏳⌛]\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  startDate: /🛫\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  createdDate: /➕\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  doneDate: /✅\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  cancelledDate: /❌\uFE0F?\s*(\d{4}-\d{2}-\d{2})/u,
  recurrence: /🔁\uFE0F?\s*([a-zA-Z0-9, !]+)/u,
  tags: /#([^\s#]+)/g,
};

/**
 * Tasks 格式解析结果
 */
export interface TasksParseResult {
  // 去除 emoji 标记后的纯文本描述
  cleanDescription: string;
  // 原始文本
  rawText: string;
  // 优先级 (highest, high, medium, low, lowest, none)
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest' | 'none';
  // 各类日期
  dueDate: string | null;
  scheduledDate: string | null;
  startDate: string | null;
  createdDate: string | null;
  doneDate: string | null;
  cancelledDate: string | null;
  // 重复规则
  recurrence: string | null;
  // 标签
  tags: string[];
  // 是否包含 Tasks 格式内容
  hasTasksFormat: boolean;
}

/**
 * 解析 Tasks 格式的文本
 */
export function parseTasksFormat(text: string): TasksParseResult {
  const result: TasksParseResult = {
    cleanDescription: text,
    rawText: text,
    priority: 'none',
    dueDate: null,
    scheduledDate: null,
    startDate: null,
    createdDate: null,
    doneDate: null,
    cancelledDate: null,
    recurrence: null,
    tags: [],
    hasTasksFormat: false,
  };

  let cleanText = text;

  // 解析优先级
  const priorityMatch = text.match(TASKS_REGEXES.priority);
  if (priorityMatch) {
    result.hasTasksFormat = true;
    const symbol = priorityMatch[1];
    if (symbol === '🔺') result.priority = 'highest';
    else if (symbol === '⏫') result.priority = 'high';
    else if (symbol === '🔼') result.priority = 'medium';
    else if (symbol === '🔽') result.priority = 'low';
    else if (symbol === '⏬') result.priority = 'lowest';
    cleanText = cleanText.replace(TASKS_REGEXES.priority, '').trim();
  }

  // 解析截止日期
  const dueDateMatch = text.match(TASKS_REGEXES.dueDate);
  if (dueDateMatch) {
    result.hasTasksFormat = true;
    result.dueDate = dueDateMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.dueDate, '').trim();
  }

  // 解析计划日期
  const scheduledMatch = text.match(TASKS_REGEXES.scheduledDate);
  if (scheduledMatch) {
    result.hasTasksFormat = true;
    result.scheduledDate = scheduledMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.scheduledDate, '').trim();
  }

  // 解析开始日期
  const startMatch = text.match(TASKS_REGEXES.startDate);
  if (startMatch) {
    result.hasTasksFormat = true;
    result.startDate = startMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.startDate, '').trim();
  }

  // 解析创建日期
  const createdMatch = text.match(TASKS_REGEXES.createdDate);
  if (createdMatch) {
    result.hasTasksFormat = true;
    result.createdDate = createdMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.createdDate, '').trim();
  }

  // 解析完成日期
  const doneMatch = text.match(TASKS_REGEXES.doneDate);
  if (doneMatch) {
    result.hasTasksFormat = true;
    result.doneDate = doneMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.doneDate, '').trim();
  }

  // 解析取消日期
  const cancelledMatch = text.match(TASKS_REGEXES.cancelledDate);
  if (cancelledMatch) {
    result.hasTasksFormat = true;
    result.cancelledDate = cancelledMatch[1];
    cleanText = cleanText.replace(TASKS_REGEXES.cancelledDate, '').trim();
  }

  // 解析重复规则
  const recurrenceMatch = text.match(TASKS_REGEXES.recurrence);
  if (recurrenceMatch) {
    result.hasTasksFormat = true;
    result.recurrence = recurrenceMatch[1].trim();
    cleanText = cleanText.replace(TASKS_REGEXES.recurrence, '').trim();
  }

  // 解析标签
  const tagMatches = text.matchAll(TASKS_REGEXES.tags);
  for (const match of tagMatches) {
    result.tags.push(match[1]);
  }

  result.cleanDescription = cleanText;
  return result;
}

/**
 * 将优先级映射到插件的 Priority 类型
 */
export function mapTasksPriorityToPluginPriority(
  tasksPriority: TasksParseResult['priority']
): 'low' | 'medium' | 'high' {
  switch (tasksPriority) {
    case 'highest':
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    case 'lowest':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * 获取优先级的显示图标
 */
export function getPriorityIcon(priority: TasksParseResult['priority']): string {
  switch (priority) {
    case 'highest': return '🔺';
    case 'high': return '⏫';
    case 'medium': return '🔼';
    case 'low': return '🔽';
    case 'lowest': return '⏬';
    default: return '';
  }
}
