/**
 * 待办事项优先级
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * 待办事项数据模型
 */
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;           // ISO 日期字符串
  tags: string[];
  linkedNote?: string;        // Obsidian 笔记路径
  createdAt: string;
  updatedAt: string;
}

/**
 * 待办插件设置
 */
export interface TodoPluginSettings {
  defaultPriority: Priority;
  showCompleted: boolean;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  autoRefresh: boolean;
}

/**
 * 视图模式
 */
export type ViewMode = 'all' | 'active' | 'completed';
