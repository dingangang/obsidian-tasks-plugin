import { TFile, App, Notice, TFolder, TAbstractFile } from 'obsidian';
import { TodoItemModel } from '../models/TodoItem';
import { TodoItem, TodoPluginSettings, Priority } from '../types';

/**
 * 待办事项服务类
 * 负责数据的 CRUD 操作和持久化
 */
export class TodoService {
  private app: App;
  private settings: TodoPluginSettings;
  private todos: TodoItemModel[] = [];
  private dataFile: TFile | null = null;
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
      const vault = this.app.vault;
      const filePath = this.settings.todoFilePath;

      // 1. 尝试直接获取文件
      let abstractFile = vault.getAbstractFileByPath(filePath);
      let file: TFile | null = null;

      if (abstractFile instanceof TFile) {
        file = abstractFile;
      } else {
        // 2. 尝试不区分大小写查找
        const allFiles = vault.getFiles();
        file = allFiles.find(f => f.path.toLowerCase() === filePath.toLowerCase()) || null;
      }

      // 3. 如果还是找不到，尝试创建
      if (!file) {
        await this.createDefaultFile();
        abstractFile = vault.getAbstractFileByPath(filePath);
        if (abstractFile instanceof TFile) {
          file = abstractFile;
        } else {
          // 再次兜底
          const allFiles = vault.getFiles();
          file = allFiles.find(f => f.path.toLowerCase() === filePath.toLowerCase()) || null;
        }
      }

      // 4. 加载数据
      if (file) {
        this.dataFile = file;
        const content = await vault.read(file);
        const data = this.parseContent(content);
        this.todos = data.map(item => TodoItemModel.fromObject(item));
        console.log(`📋 Loaded ${this.todos.length} todos from ${file.path}`);
      } else {
        console.error(`📋 Could not find or create todo file at ${filePath}`);
        this.todos = [];
      }
    } catch (error) {
      console.error('Failed to load todos from file:', error);
      this.todos = [];
    }
  }

  /**
   * 保存数据到文件
   */
  private async saveToFile(): Promise<void> {
    try {
      if (!this.dataFile) {
        await this.createDefaultFile();
        const file = this.app.vault.getAbstractFileByPath(this.settings.todoFilePath);
        if (file instanceof TFile) {
          this.dataFile = file;
        }
      }

      if (this.dataFile) {
        const content = this.serializeContent();
        await this.app.vault.modify(this.dataFile, content);
      }
    } catch (error) {
      console.error('Failed to save todos to file:', error);
      new Notice('❌ 保存待办事项失败: ' + (error.message || '未知错误'));
      throw error;
    }
  }

  /**
   * 创建默认数据文件
   */
  private async createDefaultFile(): Promise<void> {
    const vault = this.app.vault;
    const filePath = this.settings.todoFilePath;

    // 检查父目录是否存在
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const parentDir = filePath.substring(0, lastSlashIndex);
      const parent = vault.getAbstractFileByPath(parentDir);
      if (!parent) {
        await vault.createFolder(parentDir);
      } else if (!(parent instanceof TFolder)) {
        throw new Error(`路径 ${parentDir} 已存在但不是文件夹`);
      }
    }

    // 再次确认文件是否真的不存在
    const existingFile = vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      if (existingFile instanceof TFile) return; // 已存在则直接返回
      throw new Error(`路径 ${filePath} 已存在但不是文件`);
    }

    const initialContent = this.serializeContent([]);
    try {
      await vault.create(filePath, initialContent);
      new Notice('✅ 已创建待办事项数据文件');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        return;
      }
      throw e;
    }
  }

  /**
   * 序列化内容（YAML 格式）
   */
  private serializeContent(todos?: TodoItem[]): string {
    const items = todos || this.todos.map(t => t.toObject());
    const yaml = items.map(todo => this.objectToYaml(todo)).join('\n---\n');
    return `---\ntitle: 待办事项\ncreated: ${new Date().toISOString()}\n---\n\n${yaml}`;
  }

  /**
   * 将对象转换为 YAML
   */
  private objectToYaml(obj: TodoItem): string {
    const lines = ['id: ' + obj.id];
    lines.push('title: ' + this.escapeYaml(obj.title));
    if (obj.description) {
      lines.push('description: ' + this.escapeYaml(obj.description));
    }
    lines.push('completed: ' + obj.completed);
    lines.push('priority: ' + obj.priority);
    if (obj.dueDate) {
      lines.push('dueDate: ' + obj.dueDate);
    }
    if (obj.tags.length > 0) {
      lines.push('tags: [' + obj.tags.map(t => `'${t}'`).join(', ') + ']');
    }
    if (obj.linkedNote) {
      lines.push('linkedNote: ' + obj.linkedNote);
    }
    lines.push('createdAt: ' + obj.createdAt);
    lines.push('updatedAt: ' + obj.updatedAt);
    return lines.join('\n');
  }

  /**
   * 解析文件内容
   */
  private parseContent(content: string): TodoItem[] {
    const todos: TodoItem[] = [];
    const blocks = content.split(/\r?\n---\r?\n/);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block) continue;

      if (!block.includes('id:') || !block.includes('title:')) {
        continue;
      }

      const todo = this.yamlToObject(block);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }

  /**
   * 简单 YAML 解析
   */
  private yamlToObject(yaml: string): TodoItem | null {
    const lines = yaml.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const key = trimmed.substring(0, colonIndex).trim();
      let value: any = trimmed.substring(colonIndex + 1).trim();

      // 处理值
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1);
        value = inner.split(',').map((s: string) => {
          const trimmed = s.trim().replace(/^['"]|['"]$/g, '');
          return trimmed;
        }).filter((s: string) => Boolean(s));
      }

      result[key] = this.unescapeYaml(value);
    }

    if (!result.title) return null;

    return {
      id: result.id || Date.now().toString(),
      title: result.title,
      description: result.description || '',
      completed: result.completed || false,
      priority: result.priority || 'medium',
      dueDate: result.dueDate,
      tags: result.tags || [],
      linkedNote: result.linkedNote,
      createdAt: result.createdAt || new Date().toISOString(),
      updatedAt: result.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * 反转义 YAML 字符串
   */
  private unescapeYaml(val: any): any {
    if (typeof val !== 'string') return val;
    return val.replace(/\\:/g, ':').replace(/\\n/g, '\n');
  }

  /**
   * 转义 YAML 字符串
   */
  private escapeYaml(str: string): string {
    return str.replace(/:/g, '\\:').replace(/\n/g, '\\n');
  }
}
