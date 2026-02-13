import { App, Notice } from 'obsidian';
import { TodoItemModel } from '../models/TodoItem';
import { TodoItem, TodoPluginSettings, Priority } from '../types';

/**
 * JSON 数据文件格式
 */
interface TodoDataFile {
  version: string;
  lastModified: string;
  todos: TodoItem[];
}

/**
 * 待办事项服务类
 * 负责数据的 CRUD 操作和持久化
 */
export class TodoService {
  private app: App;
  private settings: TodoPluginSettings;
  private todos: TodoItemModel[] = [];
  private onUpdateCallbacks: (() => void)[] = [];

  constructor(app: App, settings: TodoPluginSettings) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    await this.loadFromFile();
  }

  /**
   * 获取所有待办事项
   */
  getAllTodos(): TodoItemModel[] {
    return this.todos;
  }

  /**
   * 订阅更新
   */
  onUpdate(callback: () => void): () => void {
    this.onUpdateCallbacks.push(callback);
    return () => {
      this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 触发更新通知
   */
  private triggerUpdate(): void {
    // 使用 setTimeout 将通知放到下一个事件循环，避免阻塞主流程或被外部错误中断
    setTimeout(() => {
      this.onUpdateCallbacks.forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.error('Error in todo update callback:', e);
        }
      });
    }, 0);
  }

  /**
   * 获取未完成的待办事项
   */
  getActiveTodos(): TodoItemModel[] {
    return this.todos.filter(todo => !todo.completed);
  }

  /**
   * 获取已完成的待办事项
   */
  getCompletedTodos(): TodoItemModel[] {
    return this.todos.filter(todo => todo.completed);
  }

  /**
   * 根据 ID 获取待办事项
   */
  getTodoById(id: string): TodoItemModel | undefined {
    return this.todos.find(todo => todo.id === id);
  }

  /**
   * 添加待办事项
   */
  async addTodo(data: Partial<TodoItem>): Promise<TodoItemModel> {
    const todo = new TodoItemModel(data);
    this.todos.push(todo);
    await this.saveToFile();
    this.triggerUpdate();
    return todo;
  }

  /**
   * 更新待办事项
   */
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<boolean> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) return false;

    this.todos[index].update(updates);
    await this.saveToFile();
    this.triggerUpdate();
    return true;
  }

  /**
   * 删除待办事项
   */
  async deleteTodo(id: string): Promise<boolean> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) return false;

    this.todos.splice(index, 1);
    await this.saveToFile();
    this.triggerUpdate();
    return true;
  }

  /**
   * 切换完成状态
   */
  async toggleTodoComplete(id: string): Promise<boolean> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return false;

    todo.toggleComplete();
    await this.saveToFile();
    this.triggerUpdate();
    return true;
  }

  /**
   * 批量删除已完成的事项
   */
  async clearCompleted(): Promise<number> {
    const completedCount = this.getCompletedTodos().length;
    this.todos = this.todos.filter(todo => !todo.completed);
    await this.saveToFile();
    this.triggerUpdate();
    return completedCount;
  }

  /**
   * 根据标签筛选
   */
  getTodosByTag(tag: string): TodoItemModel[] {
    return this.todos.filter(todo => todo.tags.includes(tag));
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.todos.forEach(todo => {
      todo.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * 获取按优先级分组的待办事项
   */
  getTodosByPriority(priority: Priority): TodoItemModel[] {
    return this.todos.filter(todo => todo.priority === priority);
  }

  /**
   * 排序待办事项
   */
  sortTodos(todos: TodoItemModel[], sortBy: TodoPluginSettings['sortBy']): TodoItemModel[] {
    const sorted = [...todos];

    switch (sortBy) {
      case 'dueDate':
        sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case 'priority':
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
        break;
      case 'createdAt':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }

  /**
   * 统计信息
   */
  getStatistics(): {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    completionRate: number;
  } {
    const total = this.todos.length;
    const active = this.getActiveTodos().length;
    const completed = this.getCompletedTodos().length;
    const overdue = this.todos.filter(t => t.isOverdue()).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      active,
      completed,
      overdue,
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * 从文件加载数据
   */
  private async loadFromFile(): Promise<void> {
    try {
      const dataPath = this.getDataFilePath();

      // 尝试读取主数据文件
      try {
        const content = await this.app.vault.adapter.read(dataPath);
        const data = JSON.parse(content) as TodoDataFile;
        this.todos = data.todos.map(item => TodoItemModel.fromObject(item));
        console.log(`📋 Loaded ${this.todos.length} todos from ${dataPath}`);
        return;
      } catch (error) {
        console.warn('Failed to load main data file, attempting backup recovery:', error);
      }

      // 主文件读取失败，尝试从备份恢复
      const restored = await this.restoreFromBackup();
      if (restored) {
        new Notice('✅ 从备份恢复数据成功');
        return;
      }

      // 备份恢复失败，创建空数据文件
      console.log('📋 No valid data found, creating new data file');
      await this.createDefaultFile();
      this.todos = [];
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.todos = [];
    }
  }

  /**
   * 保存数据到文件
   */
  private async saveToFile(): Promise<void> {
    try {
      // 先创建备份
      await this.createBackup();

      // 序列化并保存
      const content = this.serializeContent();
      const dataPath = this.getDataFilePath();

      // 确保目录存在
      await this.ensureDataDirectory();

      // 写入文件
      await this.app.vault.adapter.write(dataPath, content);
    } catch (error) {
      console.error('Failed to save todos:', error);
      new Notice('❌ 保存待办事项失败: ' + (error.message || '未知错误'));
      throw error;
    }
  }

  /**
   * 创建默认数据文件
   */
  private async createDefaultFile(): Promise<void> {
    const dataPath = this.getDataFilePath();

    // 确保目录存在
    await this.ensureDataDirectory();

    // 创建空数据文件
    const emptyData: TodoDataFile = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      todos: []
    };

    try {
      await this.app.vault.adapter.write(dataPath, JSON.stringify(emptyData, null, 2));
      new Notice('✅ 已创建待办事项数据文件');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        return;
      }
      throw e;
    }
  }

  /**
   * 序列化内容（JSON 格式）
   */
  private serializeContent(): string {
    const data: TodoDataFile = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      todos: this.todos.map(t => t.toObject())
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 获取数据文件路径
   */
  private getDataFilePath(): string {
    return `${this.app.vault.configDir}/plugins/obsidian-tasks-plugin/data.json`;
  }

  /**
   * 获取备份文件路径
   */
  private getBackupFilePath(): string {
    return `${this.app.vault.configDir}/plugins/obsidian-tasks-plugin/data.json.bak`;
  }

  /**
   * 创建备份文件
   */
  private async createBackup(): Promise<void> {
    const dataPath = this.getDataFilePath();
    const backupPath = this.getBackupFilePath();

    try {
      const content = await this.app.vault.adapter.read(dataPath);
      await this.app.vault.adapter.write(backupPath, content);
    } catch (e) {
      console.warn('Failed to create backup:', e);
    }
  }

  /**
   * 从备份恢复数据
   */
  private async restoreFromBackup(): Promise<boolean> {
    const backupPath = this.getBackupFilePath();

    try {
      const content = await this.app.vault.adapter.read(backupPath);
      const data = JSON.parse(content) as TodoDataFile;
      this.todos = data.todos.map(item => TodoItemModel.fromObject(item));

      // 恢复成功后，重新保存到主文件
      await this.ensureDataDirectory();
      const dataPath = this.getDataFilePath();
      await this.app.vault.adapter.write(dataPath, content);

      console.log(`📋 Restored ${this.todos.length} todos from backup`);
      return true;
    } catch (e) {
      console.warn('Failed to restore from backup:', e);
      return false;
    }
  }

  /**
   * 确保数据目录存在
   */
  private async ensureDataDirectory(): Promise<void> {
    const dir = `${this.app.vault.configDir}/plugins/obsidian-tasks-plugin`;

    try {
      // 检查目录是否存在（尝试读取，失败则说明不存在）
      await this.app.vault.adapter.list(dir);
    } catch (e) {
      // 目录不存在，创建它
      await this.app.vault.adapter.mkdir(dir);
    }
  }
}
