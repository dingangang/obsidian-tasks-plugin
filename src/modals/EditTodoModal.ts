import { App, Modal, Notice, TFile, MarkdownRenderer, Component } from 'obsidian';
import { TodoService } from '../services/TodoService';
import { Priority } from '../types';
import { parseTasksFormat, mapTasksPriorityToPluginPriority } from '../utils/tasksParser';
import { TasksSuggester } from '../suggests/TasksSuggester';

export class EditTodoModal extends Modal {
  private todoService: TodoService;
  private todoId: string;
  private todo: any;

  // 表单数据
  private title: string = '';
  private description: string = '';
  private priority: Priority = 'medium';
  private dueDate: string = '';
  private tagsInput: string = '';
  private linkedNote: string = '';

  // UI Elements
  private priorityBtns: HTMLElement[] = [];
  private dateInput: HTMLInputElement | null = null;
  private tasksSuggester: TasksSuggester | null = null;
  private previewEl: HTMLElement;
  private component: Component;

  constructor(app: App, todoService: TodoService, todoId: string) {
    super(app);
    this.todoService = todoService;
    this.todoId = todoId;
    this.component = new Component();
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    // 获取待办事项
    this.todo = this.todoService.getTodoById(this.todoId);
    if (!this.todo) {
      new Notice('❌ 待办事项不存在');
      this.close();
      return;
    }

    // 初始化表单数据
    this.title = this.todo.title;
    this.description = this.todo.description || '';
    this.priority = this.todo.priority;
    this.dueDate = this.todo.dueDate
      ? new Date(this.todo.dueDate).toISOString().split('T')[0]
      : '';
    this.tagsInput = (this.todo.tags || []).join(', ');
    this.linkedNote = this.todo.linkedNote || '';

    this.render(contentEl);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.component.unload();
  }

  private render(contentEl: HTMLElement): void {
    contentEl.createEl('h2', { text: '编辑待办事项' });

    // 标题
    this.createTextField(contentEl, '标题', 'todo-title-input', '输入待办事项... (支持 Tasks 格式: 🔺 📅)', (value) => {
      this.title = value;
      this.renderPreview();
    }, this.title, true);

    // 描述
    this.createTextArea(contentEl, '描述 (可选)', 'todo-desc-input', '添加详细描述... (支持 Tasks 格式)', (value) => {
      this.description = value;
      this.renderPreview();
    }, this.description, true);

    // 预览区域
    contentEl.createEl('h3', { text: '预览' });
    this.previewEl = contentEl.createDiv({ cls: 'todo-preview markdown-preview-view' });
    this.renderPreview();

    // 优先级
    this.createPrioritySelect(contentEl);

    // 截止日期
    this.createDateField(contentEl);

    // 标签
    this.createTagsField(contentEl);

    // 关联笔记
    this.createNoteSelector(contentEl);

    // 按钮
    this.createButtons(contentEl);
  }

  private createTextField(
    parent: HTMLElement,
    label: string,
    cls: string,
    placeholder: string,
    onChange: (value: string) => void,
    defaultValue?: string,
    isTitle: boolean = false
  ): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: label });

    const input = container.createEl('input', {
      type: 'text',
      cls: cls,
      placeholder: placeholder
    });

    if (defaultValue) {
      input.value = defaultValue;
    }

    input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (isTitle) {
        this.handleInputParsing(target.value);
      }
      onChange(target.value);
    });

    // 回车提交
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.submit();
      }
    });
  }

  private createTextArea(
    parent: HTMLElement,
    label: string,
    cls: string,
    placeholder: string,
    onChange: (value: string) => void,
    defaultValue?: string,
    isDescription: boolean = false
  ): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: label });

    const textarea = container.createEl('textarea', {
      cls: cls,
      placeholder: placeholder
    });
    textarea.rows = 3;

    if (defaultValue) {
      textarea.value = defaultValue;
    }

    textarea.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLTextAreaElement;

      if (isDescription) {
        this.handleInputParsing(target.value);
      }

      onChange(target.value);
    });

    // 初始化 Suggester
    if (isDescription) {
      setTimeout(() => {
        this.tasksSuggester = new TasksSuggester(this.app, textarea, container);
      }, 0);
    }
  }

  private createPrioritySelect(parent: HTMLElement): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: '优先级' });

    const btnGroup = container.createDiv({ cls: 'priority-btn-group' });
    this.priorityBtns = [];

    const priorities: { value: Priority; label: string }[] = [
      { value: 'high', label: '🔴 高' },
      { value: 'medium', label: '🟡 中' },
      { value: 'low', label: '🟢 低' },
    ];

    priorities.forEach(({ value, label }) => {
      const btn = btnGroup.createEl('button', {
        cls: `priority-btn ${this.priority === value ? 'active' : ''}`,
        text: label
      });
      this.priorityBtns.push(btn);

      btn.addEventListener('click', () => {
        this.setPriority(value);
      });
    });
  }

  private setPriority(value: Priority): void {
    this.priority = value;
    this.priorityBtns.forEach(btn => {
      btn.removeClass('active');
    });

    const index = ['high', 'medium', 'low'].indexOf(value);
    if (index !== -1 && this.priorityBtns[index]) {
      this.priorityBtns[index].addClass('active');
    }
  }

  private createDateField(parent: HTMLElement): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: '截止日期 (可选)' });

    const input = container.createEl('input', {
      type: 'date',
      cls: 'todo-due-date-input'
    });
    this.dateInput = input;

    if (this.dueDate) {
      input.value = this.dueDate;
    }

    input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.dueDate = target.value;
    });
  }

  private createTagsField(parent: HTMLElement): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: '标签 (用逗号分隔，可选)' });

    const input = container.createEl('input', {
      type: 'text',
      cls: 'todo-tags-input',
      placeholder: '工作, 学习, 个人'
    });

    if (this.tagsInput) {
      input.value = this.tagsInput;
    }

    input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.tagsInput = target.value;
    });
  }

  private createNoteSelector(parent: HTMLElement): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: '关联笔记 (可选)' });

    const noteContainer = container.createDiv({ cls: 'note-selector' });

    const input = noteContainer.createEl('input', {
      type: 'text',
      cls: 'todo-note-input',
      placeholder: '输入笔记路径或点击选择...'
    });

    if (this.linkedNote) {
      input.value = this.linkedNote;
    }

    const selectBtn = noteContainer.createEl('button', { cls: 'note-select-btn' });
    selectBtn.textContent = '📂';
    selectBtn.title = '选择笔记';

    selectBtn.addEventListener('click', async () => {
      const files = this.getMarkdownFiles();
      if (files.length === 0) {
        new Notice('没有找到 Markdown 文件');
        return;
      }
      this.showNotePicker(files, input);
    });

    input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.linkedNote = target.value;
    });
  }

  private getMarkdownFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  private showNotePicker(files: TFile[], input: HTMLInputElement): void {
    const existingPicker = document.body.querySelector('.note-picker-modal');
    if (existingPicker) existingPicker.remove();

    const picker = document.body.createDiv({ cls: 'note-picker-modal' });
    picker.createEl('h3', { text: '选择关联笔记' });

    const fileList = picker.createDiv({ cls: 'note-file-list' });

    const searchInput = fileList.createEl('input', {
      type: 'text',
      placeholder: '搜索笔记...'
    });

    const listContainer = fileList.createDiv({ cls: 'note-list-container' });

    const renderFiles = (filter: string = '') => {
      listContainer.empty();

      const filtered = files.filter(f =>
        f.path.toLowerCase().includes(filter.toLowerCase())
      ).slice(0, 50);

      filtered.forEach(file => {
        const item = listContainer.createDiv({ cls: 'note-file-item' });
        item.textContent = file.path;
        item.addEventListener('click', () => {
          this.linkedNote = file.path;
          input.value = file.path;
          picker.remove();
        });
      });
    };

    searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      renderFiles(target.value);
    });

    renderFiles();

    const closeBtn = picker.createEl('button', { cls: 'picker-close-btn' });
    closeBtn.textContent = '✕ 关闭';
    closeBtn.addEventListener('click', () => picker.remove());

    picker.addEventListener('click', (e) => {
      if (e.target === picker) picker.remove();
    });
  }

  private createButtons(parent: HTMLElement): void {
    const btnGroup = parent.createDiv({ cls: 'modal-buttons' });

    const cancelBtn = btnGroup.createEl('button', { cls: 'modal-btn cancel' });
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => this.close());

    const submitBtn = btnGroup.createEl('button', { cls: 'modal-btn submit' });
    submitBtn.textContent = '保存';
    submitBtn.addEventListener('click', () => this.submit());
  }

  private async submit(): Promise<void> {
    if (!this.title.trim()) {
      new Notice('❌ 请输入待办事项标题');
      return;
    }

    const tags = this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const dueDate = this.dueDate ? new Date(this.dueDate).toISOString() : undefined;

    try {
      // 解析标题和描述中的 Tasks 格式并清理
      const titleParseResult = parseTasksFormat(this.title.trim());
      const finalTitle = titleParseResult.cleanDescription;

      let finalDescription = this.description.trim();
      if (finalDescription) {
        const descParseResult = parseTasksFormat(finalDescription);
        finalDescription = descParseResult.cleanDescription;
      }

      await this.todoService.updateTodo(this.todoId, {
        title: finalTitle,
        description: finalDescription || undefined,
        priority: this.priority,
        dueDate,
        tags,
        linkedNote: this.linkedNote || undefined,
      });

      new Notice('✅ 待办事项已更新');
      this.close();
    } catch (error) {
      console.error('Failed to update todo:', error);
      new Notice('❌ 更新待办事项失败');
    }
  }

  /**
   * 处理输入，解析 Tasks 格式
   */
  private handleInputParsing(value: string): void {
    const result = parseTasksFormat(value);

    if (result.hasTasksFormat) {
      if (result.priority !== 'none') {
        const priority = mapTasksPriorityToPluginPriority(result.priority);
        this.setPriority(priority);
      }

      if (result.dueDate) {
        this.dueDate = result.dueDate;
        if (this.dateInput) {
          this.dateInput.value = result.dueDate;
        }
      }
    }
  }

  /**
   * 渲染预览
   */
  private async renderPreview(): Promise<void> {
    if (!this.previewEl) return;

    this.previewEl.empty();

    const fullContent = [
      `- [ ] ${this.title || '标题'}`,
      this.description || ''
    ].join('\n\n');

    await MarkdownRenderer.render(
      this.app,
      fullContent,
      this.previewEl,
      '',
      this.component
    );

    // 处理复选框点击
    const checkboxes = this.previewEl.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      checkbox.addEventListener('click', (e) => {
        e.preventDefault();

        // 如果是 Description 里的:
        const descLines = this.description.split('\n');

        if (index === 0) {
          return;
        }

        let matchCount = 0;
        let newDesc = this.description;

        newDesc = newDesc.replace(/- \[( |x|X)\]/g, (match) => {
          matchCount++;
          if (matchCount === index) {
            return match.includes('x') || match.includes('X') ? '- [ ]' : '- [x]';
          }
          return match;
        });

        if (newDesc !== this.description) {
          this.description = newDesc;
          const textarea = this.contentEl.querySelector('.todo-desc-input') as HTMLTextAreaElement;
          if (textarea) textarea.value = newDesc;
          this.renderPreview();
        }
      });
    });
  }
}
