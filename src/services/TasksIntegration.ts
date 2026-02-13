import { App, TFile } from 'obsidian';

/**
 * Tasks 插件集成服务
 * 用于检测和与 Obsidian Tasks 插件交互
 */
export class TasksIntegration {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 检查 Tasks 插件是否已启用
   */
  isTasksPluginEnabled(): boolean {
    try {
      return (this.app as any).plugins?.enabledPlugins?.has('obsidian-tasks-plugin') ?? false;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Tasks 插件实例
   */
  getTasksPlugin(): any | null {
    if (!this.isTasksPluginEnabled()) return null;
    try {
      return (this.app as any).plugins?.plugins?.['obsidian-tasks-plugin'] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 获取 Tasks 插件设置
   */
  getTasksPluginSettings(): any | null {
    try {
      const suggests = (this.app as any).workspace?.editorSuggest?.suggests;
      if (!suggests) return null;
      return suggests.find((s: any) => s.settings?.taskFormat)?.settings ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 获取 Tasks 插件的"完成"状态字符
   */
  getTaskStatusDone(): string {
    const settings = this.getTasksPluginSettings();
    const statuses = settings?.statusSettings;
    if (!statuses) return 'x';

    let done = statuses.coreStatuses?.find((s: any) => s.type === 'DONE');
    if (!done) {
      done = statuses.customStatuses?.find((s: any) => s.type === 'DONE');
    }
    return done?.symbol ?? 'x';
  }

  /**
   * 使用 Tasks 插件的 API 切换任务状态
   * @param taskLine 完整的任务行（包含 `- [ ]` 前缀）
   * @param filePath 文件路径
   * @returns 切换后的任务行，如果失败返回 null
   */
  toggleTaskWithTasksPlugin(taskLine: string, filePath: string): string | null {
    const plugin = this.getTasksPlugin();
    if (!plugin?.apiV1?.executeToggleTaskDoneCommand) return null;

    try {
      return plugin.apiV1.executeToggleTaskDoneCommand(taskLine, filePath);
    } catch {
      return null;
    }
  }
}
