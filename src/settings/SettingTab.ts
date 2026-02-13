import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import TodoPlugin from '../../main';

/**
 * 待办事项插件设置页面
 */
export class TodoSettingTab extends PluginSettingTab {
  plugin: TodoPlugin;

  constructor(app: App, plugin: TodoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 标题
    containerEl.createEl('h2', { text: '📋 待办事项设置' });

    // 统计信息
    this.renderStatistics(containerEl);

    // 数据存储信息
    this.renderDataStorageInfo(containerEl);

    // 默认设置
    this.renderDefaultSettings(containerEl);

    // 视图设置
    this.renderViewSettings(containerEl);

    // 数据操作
    this.renderDataActions(containerEl);

    // 帮助信息
    this.renderHelp(containerEl);
  }

  /**
   * 渲染统计信息
   */
  private renderStatistics(containerEl: HTMLElement): void {
    const statsContainer = containerEl.createDiv({ cls: 'settings-stats' });
    statsContainer.createEl('h3', { text: '📊 统计信息' });

    // 获取统计数据
    const todoService = (this.plugin as any).todoService;
    if (todoService) {
      const stats = todoService.getStatistics();

      statsContainer.createEl('p', {
        text: `总待办事项: ${stats.total}`
      });
      statsContainer.createEl('p', {
        text: `未完成: ${stats.active}`
      });
      statsContainer.createEl('p', {
        text: `已完成: ${stats.completed}`
      });
      statsContainer.createEl('p', {
        text: `已过期: ${stats.overdue}`
      });
      statsContainer.createEl('p', {
        text: `完成率: ${stats.completionRate}%`
      });
    } else {
      statsContainer.createEl('p', {
        text: '正在加载统计数据...'
      });
    }
  }

  /**
   * 渲染数据存储信息
   */
  private renderDataStorageInfo(containerEl: HTMLElement): void {
    const settingsContainer = containerEl.createDiv({ cls: 'settings-group' });
    settingsContainer.createEl('h3', { text: '💾 数据存储' });

    const configDir = this.app.vault.configDir;
    const dataPath = `${configDir}/plugins/obsidian-tasks-plugin/data.json`;
    const backupPath = `${configDir}/plugins/obsidian-tasks-plugin/data.json.bak`;

    settingsContainer.createEl('p', {
      text: `数据文件: ${dataPath}`
    });
    settingsContainer.createEl('p', {
      text: `备份文件: ${backupPath}`
    });
    settingsContainer.createEl('p', {
      cls: 'setting-item-description',
      text: '数据自动保存在插件配置目录中，不会出现在笔记列表里。'
    });
  }

  /**
   * 渲染默认设置
   */
  private renderDefaultSettings(containerEl: HTMLElement): void {
    const settingsContainer = containerEl.createDiv({ cls: 'settings-group' });
    settingsContainer.createEl('h3', { text: '⚙️ 默认设置' });

    // 默认优先级
    new Setting(settingsContainer)
      .setName('默认优先级')
      .setDesc('新创建的待办事项的默认优先级')
      .addDropdown(dropdown => dropdown
        .addOption('low', '🟢 低')
        .addOption('medium', '🟡 中')
        .addOption('high', '🔴 高')
        .setValue(this.plugin.settings.defaultPriority)
        .onChange(async (value: 'low' | 'medium' | 'high') => {
          this.plugin.settings.defaultPriority = value;
          await this.plugin.saveSettings();
          new Notice('✅ 默认优先级已更新');
        }));
  }

  /**
   * 渲染视图设置
   */
  private renderViewSettings(containerEl: HTMLElement): void {
    const settingsContainer = containerEl.createDiv({ cls: 'settings-group' });
    settingsContainer.createEl('h3', { text: '👁️ 视图设置' });

    // 排序方式
    new Setting(settingsContainer)
      .setName('排序方式')
      .setDesc('待办事项列表的默认排序方式')
      .addDropdown(dropdown => dropdown
        .addOption('createdAt', '创建时间')
        .addOption('dueDate', '截止日期')
        .addOption('priority', '优先级')
        .addOption('title', '标题')
        .setValue(this.plugin.settings.sortBy)
        .onChange(async (value: 'dueDate' | 'priority' | 'createdAt' | 'title') => {
          this.plugin.settings.sortBy = value;
          await this.plugin.saveSettings();
          new Notice('✅ 排序方式已更新');
        }));

    // 显示已完成
    new Setting(settingsContainer)
      .setName('显示已完成')
      .setDesc('在待办列表中显示已完成的项')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showCompleted)
        .onChange(async (value) => {
          this.plugin.settings.showCompleted = value;
          await this.plugin.saveSettings();
          new Notice(value ? '✅ 已显示已完成项' : '✅ 已隐藏已完成项');
        }));

    // 自动刷新
    new Setting(settingsContainer)
      .setName('自动刷新')
      .setDesc('数据变化时自动刷新视图')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoRefresh)
        .onChange(async (value) => {
          this.plugin.settings.autoRefresh = value;
          await this.plugin.saveSettings();
        }));
  }

  /**
   * 渲染数据操作
   */
  private renderDataActions(containerEl: HTMLElement): void {
    const actionsContainer = containerEl.createDiv({ cls: 'settings-actions' });
    actionsContainer.createEl('h3', { text: '🗄️ 数据操作' });

    // 清空已完成
    const clearCompletedBtn = new Setting(actionsContainer)
      .setName('清空已完成')
      .setDesc('删除所有已完成的待办事项')
      .addButton(button => button
        .setButtonText('清空已完成')
        .setCta()
        .onClick(async () => {
          if (confirm('确定要清空所有已完成的待办事项吗？此操作不可撤销。')) {
            const todoService = (this.plugin as any).todoService;
            if (todoService) {
              const count = await todoService.clearCompleted();
              if (count > 0) {
                new Notice(`✅ 已清空 ${count} 个已完成的事项`);
              } else {
                new Notice('ℹ️ 没有已完成的待办事项');
              }
              this.display();
            }
          }
        }));

    // 导出数据
    new Setting(actionsContainer)
      .setName('导出数据')
      .setDesc('导出所有待办事项为 JSON 格式')
      .addButton(button => button
        .setButtonText('导出 JSON')
        .onClick(async () => {
          const todoService = (this.plugin as any).todoService;
          if (todoService) {
            const todos = todoService.getAllTodos().map((t: any) => t.toObject());
            const json = JSON.stringify(todos, null, 2);

            // 复制到剪贴板
            await navigator.clipboard.writeText(json);
            new Notice('✅ 数据已复制到剪贴板');
          }
        }));

    // 重置设置
    new Setting(actionsContainer)
      .setName('重置设置')
      .setDesc('将所有设置恢复为默认值')
      .addButton(button => button
        .setButtonText('重置设置')
        .setWarning()
        .onClick(async () => {
          if (confirm('确定要重置所有设置吗？')) {
            await this.plugin.saveSettings();
            new Notice('✅ 设置已重置');
            this.display();
          }
        }));
  }

  /**
   * 渲染帮助信息
   */
  private renderHelp(containerEl: HTMLElement): void {
    const helpContainer = containerEl.createDiv({ cls: 'settings-help' });
    helpContainer.createEl('h3', { text: '❓ 使用帮助' });

    helpContainer.createEl('p', {
      text: '📌 使用命令面板 (Ctrl/Cmd + P) 可以快速访问以下命令:'
    });
    helpContainer.createEl('p', {
      text: '• 打开待办面板 - 在侧边栏显示待办列表'
    });
    helpContainer.createEl('p', {
      text: '• 添加待办事项 - 快速创建新的待办'
    });
    helpContainer.createEl('p', {
      text: '• 从选中文本创建待办 - 在笔记中选中文字后创建'
    });
    helpContainer.createEl('p', {
      text: '• 切换待办格式 - 快速添加或移除 [ ] 标记'
    });

    helpContainer.createEl('p', {
      text: '💡 提示: 点击 ribbon 图标 (勾选框) 也可以快速打开待办面板'
    });
  }
}
