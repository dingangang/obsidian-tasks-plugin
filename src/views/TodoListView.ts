import { App, ItemView, WorkspaceLeaf, setIcon, Notice, TFile } from 'obsidian';
import { TodoService } from '../services/TodoService';
import { TodoItemModel } from '../models/TodoItem';
import { TodoPluginSettings, ViewMode } from '../types';

export const TODO_LIST_VIEW_TYPE = 'todo-list-view';

/**
 * 待办事项列表视图
 */
export class TodoListView extends ItemView {
  private todoService: TodoService;
  private settings: TodoPluginSettings;
  public containerEl: HTMLElement;
  private currentViewMode: ViewMode = 'all';
  private filterTag: string | null = null;
  private searchQuery: string = '';

  constructor(leaf: WorkspaceLeaf, app: App, todoService: TodoService, settings: TodoPluginSettings) {
    super(leaf);
    this.app = app;
    this.todoService = todoService;
    this.settings = settings;
  }

  getViewType(): string {
    return TODO_LIST_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '待办事项';
  }

  getIcon(): string {
    return 'check-square';
  }

  async onOpen(): Promise<void> {
    this.containerEl = this.contentEl;
    this.render();
  }

  /**
   * 刷新视图
   */
  async refresh(): Promise<void> {
    this.render();
  }

  /**
   * 渲染视图
   */
  private render(): void {
    this.containerEl.empty();
    this.containerEl.addClass('todo-list-container');

    // 统计信息
    const stats = this.todoService.getStatistics();

    // 创建头部
    this.renderHeader(stats);

    // 搜索框
    this.renderSearch();

    // 筛选按钮
    this.renderFilterButtons();

    // 待办列表
    this.renderTodoList();
  }

  /**
   * 渲染头部
   */
  private renderHeader(stats: ReturnType<TodoService['getStatistics']>): void {
    const header = this.containerEl.createDiv({ cls: 'todo-header' });

    const title = header.createDiv({ cls: 'todo-title' });
    title.createSpan({ text: '📋 待办事项' });

    // 添加按钮
    const addBtn = title.createEl('button', { cls: 'todo-add-btn' });
    addBtn.innerHTML = '<span>+</span> 添加待办';
    addBtn.addEventListener('click', () => this.openAddModal());

    const statsDiv = header.createDiv({ cls: 'todo-stats' });
    statsDiv.createSpan({ text: `${stats.active} 待办 / ${stats.completed} 已完成` });

    // 进度条
    const progressContainer = header.createDiv({ cls: 'progress-container' });
    const progressBar = progressContainer.createDiv({ cls: 'progress-bar' });
    progressBar.style.width = `${stats.completionRate}%`;
  }

  /**
   * 渲染搜索框
   */
  private renderSearch(): void {
    const searchContainer = this.containerEl.createDiv({ cls: 'todo-search' });

    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: '搜索待办事项...'
    });

    searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.searchQuery = target.value.toLowerCase();
      this.renderTodoList();
    });

    // 清除按钮
    if (this.searchQuery) {
      const clearBtn = searchContainer.createEl('button', { cls: 'search-clear-btn' });
      clearBtn.textContent = '✕';
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        searchInput.value = '';
        this.renderTodoList();
      });
    }
  }

  /**
   * 渲染筛选按钮
   */
  private renderFilterButtons(): void {
    const filterContainer = this.containerEl.createDiv({ cls: 'todo-filters' });

    const modes: { mode: ViewMode; label: string; icon: string }[] = [
      { mode: 'all', label: '全部', icon: '📋' },
      { mode: 'active', label: '待办', icon: '🔴' },
      { mode: 'completed', label: '已完成', icon: '✅' },
    ];

    modes.forEach(({ mode, label, icon }) => {
      const btn = filterContainer.createEl('button', {
        cls: `filter-btn ${this.currentViewMode === mode ? 'active' : ''}`
      });
      btn.textContent = `${icon} ${label}`;
      btn.addEventListener('click', () => {
        this.currentViewMode = mode;
        this.filterTag = null;
        this.render();
      });
    });

    // 标签筛选
    const tags = this.todoService.getAllTags();
    if (tags.length > 0) {
      tags.slice(0, 10).forEach(tag => {
        const tagBtn = filterContainer.createEl('button', {
          cls: `filter-btn tag-filter-btn ${this.filterTag === tag ? 'active' : ''}`
        });
        tagBtn.textContent = `#${tag}`;
        tagBtn.addEventListener('click', () => {
          this.filterTag = this.filterTag === tag ? null : tag;
          this.renderTodoList();
        });
      });
    }
  }

  /**
   * 渲染待办列表
   */
  private renderTodoList(): void {
    // 移除旧的列表和清空按钮（如果有）
    this.containerEl.querySelectorAll('.todo-list, .clear-completed-btn').forEach(el => el.remove());

    let todos = this.todoService.getAllTodos();

    // 筛选视图模式
    switch (this.currentViewMode) {
      case 'active':
        todos = todos.filter(t => !t.completed);
        break;
      case 'completed':
        todos = todos.filter(t => t.completed);
        break;
    }

    // 筛选标签
    if (this.filterTag) {
      todos = todos.filter(t => t.tags.includes(this.filterTag!));
    }

    // 搜索
    if (this.searchQuery) {
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(this.searchQuery) ||
        t.description?.toLowerCase().includes(this.searchQuery)
      );
    }

    // 排序
    todos = this.todoService.sortTodos(todos, this.settings.sortBy);

    // 渲染列表
    const listContainer = this.containerEl.createDiv({ cls: 'todo-list' });

    if (todos.length === 0) {
      listContainer.createDiv({
        cls: 'todo-empty',
        text: this.currentViewMode === 'completed'
          ? '暂无已完成的待办事项'
          : '暂无待办事项，点击上方按钮添加'
      });
    } else {
      todos.forEach(todo => {
        this.renderTodoItem(listContainer, todo);
      });
    }

    // 清空已完成按钮
    if (this.todoService.getCompletedTodos().length > 0) {
      const clearBtn = this.containerEl.createEl('button', { cls: 'filter-btn clear-completed-btn' });
      clearBtn.textContent = '🗑️ 清空已完成';
      clearBtn.addEventListener('click', () => this.clearCompleted());
    }
  }

  /**
   * 渲染单个待办事项
   */
  private renderTodoItem(container: HTMLElement, todo: TodoItemModel): void {
    const item = container.createDiv({ cls: 'todo-item' });
    if (todo.completed) item.addClass('completed');
    if (todo.isOverdue()) item.addClass('overdue');

    // 优先级指示器
    item.createDiv({ cls: `priority-indicator priority-${todo.priority}` });

    // 复选框
    const checkbox = item.createDiv({ cls: 'todo-item-checkbox' });
    if (todo.completed) {
      setIcon(checkbox, 'check');
    }
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleTodo(todo.id);
    });

    // 内容区域
    const content = item.createDiv({ cls: 'todo-item-content' });

    const title = content.createDiv({ cls: 'todo-item-title' });
    title.textContent = todo.title;
    title.addEventListener('click', () => this.openEditModal(todo.id));

    // 描述
    if (todo.description) {
      const desc = content.createDiv({ cls: 'todo-item-desc' });
      desc.textContent = todo.description;
    }

    // 元信息
    const meta = content.createDiv({ cls: 'todo-item-meta' });

    // 截止日期
    if (todo.dueDate) {
      const dueDate = meta.createSpan({ cls: 'todo-due-date' });
      const daysRemaining = todo.getDaysRemaining();

      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          dueDate.textContent = `📅 已过期 ${Math.abs(daysRemaining)} 天`;
          dueDate.addClass('overdue');
        } else if (daysRemaining === 0) {
          dueDate.textContent = '📅 今天到期';
          dueDate.addClass('urgent');
        } else if (daysRemaining === 1) {
          dueDate.textContent = '📅 明天到期';
        } else {
          dueDate.textContent = `📅 ${daysRemaining} 天后`;
        }
      }
    }

    // 标签
    todo.tags.forEach(tag => {
      const tagSpan = meta.createSpan({ cls: 'todo-tag' });
      tagSpan.textContent = `#${tag}`;
    });

    // 操作按钮
    const actions = item.createDiv({ cls: 'todo-item-actions' });

    const editBtn = actions.createEl('button', { cls: 'action-btn edit-btn', title: '编辑' });
    setIcon(editBtn, 'pencil');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditModal(todo.id);
    });

    const deleteBtn = actions.createEl('button', { cls: 'action-btn delete-btn', title: '删除' });
    setIcon(deleteBtn, 'trash');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTodo(todo.id);
    });
  }

  /**
   * 打开添加待办弹窗
   */
  private openAddModal(): void {
    import('../modals/AddTodoModal').then(({ AddTodoModal }) => {
      new AddTodoModal(this.app, this.todoService, this.settings).open();
    });
  }

  /**
   * 打开编辑待办弹窗
   */
  private openEditModal(id: string): void {
    import('../modals/EditTodoModal').then(({ EditTodoModal }) => {
      new EditTodoModal(this.app, this.todoService, id).open();
    });
  }

  /**
   * 切换完成状态
   */
  private async toggleTodo(id: string): Promise<void> {
    await this.todoService.toggleTodoComplete(id);
    this.refresh();
  }

  /**
   * 删除待办事项
   */
  private async deleteTodo(id: string): Promise<void> {
    if (confirm('确定要删除这个待办事项吗？')) {
      await this.todoService.deleteTodo(id);
      this.refresh();
      new Notice('🗑️ 已删除待办事项');
    }
  }

  /**
   * 清空已完成
   */
  private async clearCompleted(): Promise<void> {
    if (confirm('确定要清空所有已完成的待办事项吗？')) {
      const count = await this.todoService.clearCompleted();
      if (count > 0) {
        new Notice(`🗑️ 已清空 ${count} 个已完成的事项`);
      }
      this.refresh();
    }
  }

  /**
   * 打开关联笔记
   */
  private openLinkedNote(notePath: string): void {
    const abstractFile = this.app.vault.getAbstractFileByPath(notePath);
    if (abstractFile instanceof TFile) {
      this.app.workspace.getLeaf(true).openFile(abstractFile);
    } else {
      new Notice('❌ 笔记文件不存在');
    }
  }
}
