import { App, Modal, Notice, TFile, MarkdownRenderer, Component } from 'obsidian';
import { TodoService } from '../services/TodoService';
import { TodoPluginSettings, Priority } from '../types';
import { parseTasksFormat, mapTasksPriorityToPluginPriority } from '../utils/tasksParser';
import { TasksSuggester } from '../suggests/TasksSuggester';

export class AddTodoModal extends Modal {
  private todoService: TodoService;
  private settings: TodoPluginSettings;

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

  constructor(app: App, todoService: TodoService, settings: TodoPluginSettings) {
    super(app);
    this.todoService = todoService;
    this.settings = settings;
    this.component = new Component();
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    // 设置默认优先级
    this.priority = this.settings.defaultPriority;

    this.render(contentEl);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.component.unload();
  }

  private render(contentEl: HTMLElement): void {
    contentEl.createEl('h2', { text: '添加待办事项' });

    // 标题
    this.createTextField(contentEl, '标题', 'todo-title-input', '输入待办事项... (支持 Tasks 格式: 🔺 📅)', (value) => {
      this.title = value;
      this.renderPreview();
    }, true);

    // 描述
    this.createTextArea(contentEl, '描述 (可选)', 'todo-desc-input', '添加详细描述... (支持 Tasks 格式)', (value) => {
      this.description = value;
      this.renderPreview();
    }, true);

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
    isTitle: boolean = false
  ): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: label });

    const input = container.createEl('input', {
      type: 'text',
      cls: cls,
      placeholder: placeholder
    });

    input.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;

      if (isTitle) {
        this.handleInputParsing(target.value);
      }
      onChange(value);
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
    isDescription: boolean = false
  ): void {
    const container = parent.createDiv({ cls: 'modal-field' });

    container.createEl('label', { text: label });

    const textarea = container.createEl('textarea', {
      cls: cls,
      placeholder: placeholder
    });
    textarea.rows = 3;

    textarea.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLTextAreaElement;

      if (isDescription) {
        this.handleInputParsing(target.value);
      }

      onChange(target.value);
    });

    // 初始化 Suggester
    if (isDescription) {
      // 确保 textarea 已挂载
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

    const priorities: { value: Priority; label: string; color: string }[] = [
      { value: 'high', label: '🔴 高', color: '#ff6b6b' },
      { value: 'medium', label: '🟡 中', color: '#ffd93d' },
      { value: 'low', label: '🟢 低', color: '#6bcb77' },
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

    // 打开笔记选择器按钮
    const selectBtn = noteContainer.createEl('button', { cls: 'note-select-btn' });
    selectBtn.textContent = '📂';
    selectBtn.title = '选择笔记';

    selectBtn.addEventListener('click', async () => {
      const files = this.getMarkdownFiles();
      if (files.length === 0) {
        new Notice('没有找到 Markdown 文件');
        return;
      }

      // 创建简单的笔记选择器
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
    // 移除已存在的选择器
    const existingPicker = document.body.querySelector('.note-picker-modal');
    if (existingPicker) existingPicker.remove();

    // 创建选择器
    const picker = document.body.createDiv({ cls: 'note-picker-modal' });
    picker.createEl('h3', { text: '选择关联笔记' });

    const fileList = picker.createDiv({ cls: 'note-file-list' });

    // 搜索框
    const searchInput = fileList.createEl('input', {
      type: 'text',
      placeholder: '搜索笔记...'
    });

    const listContainer = fileList.createDiv({ cls: 'note-list-container' });

    // 渲染文件列表
    const renderFiles = (filter: string = '') => {
      listContainer.empty();

      const filtered = files.filter(f =>
        f.path.toLowerCase().includes(filter.toLowerCase())
      ).slice(0, 50); // 限制显示数量

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

    // 关闭按钮
    const closeBtn = picker.createEl('button', { cls: 'picker-close-btn' });
    closeBtn.textContent = '✕ 关闭';
    closeBtn.addEventListener('click', () => picker.remove());

    // 点击外部关闭
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
    submitBtn.textContent = '添加';
    submitBtn.addEventListener('click', () => this.submit());
  }

  private async submit(): Promise<void> {
    // 验证
    if (!this.title.trim()) {
      new Notice('❌ 请输入待办事项标题');
      return;
    }

    // 解析标签
    const tags = this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // 格式化截止日期
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

      await this.todoService.addTodo({
        title: finalTitle,
        description: finalDescription || undefined,
        priority: this.priority,
        dueDate,
        tags,
        linkedNote: this.linkedNote || undefined,
      });

      new Notice('✅ 待办事项已添加');
      this.close();
    } catch (error) {
      console.error('Failed to add todo:', error);
      new Notice('❌ 添加待办事项失败');
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
      // 第一个是标题的 checkbox（我们需要忽略它，因为我们在 Modal 里不让通过点击 checkbox 来完成新建）
      // 或者我们可以让它 sync 回去？
      // 用户想在“新建”时就看到效果。如果用户点击了标题的 checkbox，理论上也可以改 title 为 `- [x]`
      // 但这里我们简单起见，主要针对 description 里的 checkbox

      checkbox.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认行为，防止闪烁
        const target = e.target as HTMLInputElement;
        const isChecked = target.checked; // 这里的 checked 其实是点击后的状态（browser 处理后）
        // 实际上对于 MarkdownRenderer 渲染的 checkbox，点击通常不会改变 DOM 状态，因为它是 static 的
        // 我们需要根据点击位置来判断

        // 简单实现：我们假设 description 里的 `- [ ]` 是用户想点的
        // 这个实现在 preview 模式下比较 tricky，因为我们需要 map 回 source
        // 简单版本：只通过 regex 替换

        // 但用户需求是: 能够支持将“- [ ]” 渲染成复选框
        // 我们至少要渲染出来。交互可能在 Add 阶段不是必须，但为了体验最好由交互。

        // 让我们实现一个简单的 toggle 逻辑：
        // 如果用户点了 description 里的 checkbox，我们尝试 toggle 对应文本

        // 由于定位太麻烦，我们这里只做展示 Render 即可，或者简单提示。
        // 但用户说 "输入“- [ ]”时，会激活语法将输入文本变成可点击的选择框"

        // 实际上，如果只是 render 出来，用户点一下没反应会很奇怪。
        // 让我们尝试做简单的 text replacement

        // 如果是 Description 里的:
        const descLines = this.description.split('\n');
        // 这是一个极其简化的 mapping，假设 checkbox 顺序对应 lines 里的 `-[ ]` 顺序
        // 标题占了一个 checkbox

        if (index === 0) {
          // 标题的 checkbox，暂时忽略或者处理
          // 我们的 title 字段通常不包含 `- [ ]` 前缀，那是为了 preview 加上去的
          return;
        }

        // description checkboxes
        // 找到第 index - 1 个 checkbox 在 description 里的位置
        let matchCount = 0;
        let newDesc = this.description;

        newDesc = newDesc.replace(/- \[( |x|X)\]/g, (match) => {
          matchCount++;
          if (matchCount === index) { // index 0 is title, so index 1 is first desc checkbox
            return match.includes('x') || match.includes('X') ? '- [ ]' : '- [x]';
          }
          return match;
        });

        if (newDesc !== this.description) {
          this.description = newDesc;
          // 更新 textarea
          const textarea = this.contentEl.querySelector('.todo-desc-input') as HTMLTextAreaElement;
          if (textarea) textarea.value = newDesc;
          this.renderPreview();
        }
      });
    });
  }
}
