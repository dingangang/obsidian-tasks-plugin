import { App, Editor, MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';

// 导入类型和类
import { TodoPluginSettings, Priority, TodoItem, ViewMode } from './src/types';
import { TodoItemModel } from './src/models/TodoItem';
import { TodoService } from './src/services/TodoService';
import { TodoListView, TODO_LIST_VIEW_TYPE } from './src/views/TodoListView';
import { AddTodoModal } from './src/modals/AddTodoModal';
import { EditTodoModal } from './src/modals/EditTodoModal';
import { TodoSettingTab } from './src/settings/SettingTab';

// 默认设置
const DEFAULT_SETTINGS: TodoPluginSettings = {
  defaultPriority: 'medium',
  showCompleted: true,
  sortBy: 'dueDate',
  autoRefresh: true,
};

export default class TodoPlugin extends Plugin {
  settings: TodoPluginSettings;
  todoService: TodoService | null = null;
  private unsubscribeUpdate: (() => void) | null = null;

  async onload() {
    await this.loadSettings();

    // 初始化 TodoService
    this.todoService = new TodoService(this.app, this.settings);
    await this.todoService.initialize();

    // 将 service 挂载到插件实例（供设置页面使用）
    (this as any).todoService = this.todoService;

    // 注册视图
    this.registerView(TODO_LIST_VIEW_TYPE, (leaf) => {
      const view = new TodoListView(leaf, this.app, this.todoService!, this.settings);
      return view;
    });

    // 监听数据更新并刷新所有待办视图
    this.unsubscribeUpdate = this.todoService.onUpdate(() => {
      this.app.workspace.getLeavesOfType(TODO_LIST_VIEW_TYPE).forEach(leaf => {
        if (leaf.view instanceof TodoListView) {
          leaf.view.refresh();
        }
      });
    });

    // 添加 ribbon 图标
    this.addRibbonIcon('check-square', '待办事项', (evt: MouseEvent) => {
      this.activateView();
    }).addClass('todo-ribbon-icon');

    // 添加状态栏
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.addClass('todo-status-bar');
    statusBarItemEl.setText('📋 待办');

    // 添加命令：打开待办面板
    this.addCommand({
      id: 'open-todo-panel',
      name: '打开待办面板',
      callback: () => {
        this.activateView();
      }
    });

    // 添加命令：添加待办
    this.addCommand({
      id: 'add-todo',
      name: '添加待办事项',
      callback: () => {
        if (this.todoService) {
          new AddTodoModal(this.app, this.todoService, this.settings).open();
        }
      }
    });

    // 添加命令：在编辑器中添加待办
    this.addCommand({
      id: 'add-todo-from-selection',
      name: '从选中文本创建待办',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection && this.todoService) {
          try {
            await this.todoService.addTodo({
              title: selection,
              linkedNote: view.file?.path,
            });
            new Notice('✅ 已创建待办事项');
          } catch (error) {
            console.error('Failed to create todo from selection:', error);
            new Notice('❌ 创建待办事项失败');
          }
        }
      }
    });

    // 添加命令：切换选中文本为待办格式
    this.addCommand({
      id: 'toggle-todo-format',
      name: '切换待办格式',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
          if (selection.startsWith('[ ] ')) {
            editor.replaceSelection(selection.replace('[ ] ', ''));
          } else if (selection.startsWith('[x] ') || selection.startsWith('[X] ')) {
            editor.replaceSelection(selection.replace(/^\[x\] /i, ''));
          } else {
            editor.replaceSelection('[ ] ' + selection);
          }
        }
      }
    });

    // 添加设置页
    this.addSettingTab(new TodoSettingTab(this.app, this));

    // 注册全局 DOM 事件
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      // 可选：点击事件处理
    });

    // 注册定时器
    this.registerInterval(window.setInterval(() => {
      // 检查过期待办并通知
      this.checkOverdueTodos();
    }, 60 * 60 * 1000)); // 每小时检查一次

    console.log('📋 待办事项插件已加载');
  }

  onunload() {
    // 关闭视图
    this.app.workspace.detachLeavesOfType(TODO_LIST_VIEW_TYPE);

    // 取消订阅
    if (this.unsubscribeUpdate) {
      this.unsubscribeUpdate();
    }

    console.log('📋 待办事项插件已卸载');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * 激活侧边栏视图
   */
  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(TODO_LIST_VIEW_TYPE);

    if (leaves.length > 0) {
      // 如果已经有视图了，激活第一个
      leaf = leaves[0];
    } else {
      // 否则在中间区域（主工作区）创建一个新的标签页
      leaf = workspace.getLeaf(true);
      if (leaf) {
        await leaf.setViewState({
          type: TODO_LIST_VIEW_TYPE,
          active: true,
        });
      }
    }

    // 展现并刷新
    if (leaf) {
      workspace.revealLeaf(leaf);
      if (leaf.view instanceof TodoListView) {
        await leaf.view.refresh();
      }
    }
  }

  /**
   * 检查过期待办并发送通知
   */
  private checkOverdueTodos() {
    if (!this.todoService) return;

    const overdue = this.todoService.getAllTodos().filter(t => t.isOverdue());

    if (overdue.length > 0) {
      // 可以选择显示通知，但不要太频繁
      // new Notice(`⚠️ 有 ${overdue.length} 个待办事项已过期`);
    }
  }
}

// 导出类型供外部使用
export type { TodoItem, TodoPluginSettings, Priority, ViewMode };
export type { TodoItemModel };
export type { TodoService };
export type { AddTodoModal, EditTodoModal };
export type { TodoListView };
export type { TodoSettingTab };
