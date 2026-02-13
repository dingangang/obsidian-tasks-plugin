/**
 * YAML 存储实现
 * 将待办事项存储为 YAML 格式的 Markdown 文件
 */

import { App, TFile, TFolder, TAbstractFile } from 'obsidian';
import { ITodoStore } from './interfaces/ITodoStore';
import type { TodoItemData } from '../../domain/types';
import { YamlSerializer } from '../parsers/YamlSerializer';
import { YamlDeserializer } from '../parsers/YamlDeserializer';

export class YamlTodoStore implements ITodoStore {
  private file: TFile | null = null;

  constructor(
    private app: App,
    private filePath: string,
    private serializer: YamlSerializer = new YamlSerializer(),
    private deserializer: YamlDeserializer = new YamlDeserializer()
  ) {}

  async initialize(): Promise<void> {
    this.file = await this.ensureFileExists();
  }

  async readAll(): Promise<TodoItemData[]> {
    if (!this.file) {
      throw new Error('Store not initialized');
    }

    try {
      const content = await this.app.vault.read(this.file);
      return this.deserializer.deserialize(content);
    } catch (error) {
      console.error('Failed to read todos:', error);
      throw new Error(`Failed to read todos: ${error}`);
    }
  }

  async saveAll(todos: TodoItemData[]): Promise<void> {
    if (!this.file) {
      throw new Error('Store not initialized');
    }

    try {
      const content = this.serializer.serialize(todos);
      await this.app.vault.modify(this.file, content);
    } catch (error) {
      console.error('Failed to save todos:', error);
      throw new Error(`Failed to save todos: ${error}`);
    }
  }

  watch(callback: () => void): () => void {
    const ref = this.app.vault.on('modify', (file) => {
      if (file === this.file) {
        callback();
      }
    });
    return () => this.app.vault.offref(ref);
  }

  getFilePath(): string {
    return this.filePath;
  }

  private async ensureFileExists(): Promise<TFile> {
    const vault = this.app.vault;

    // 尝试直接获取文件
    let abstractFile = vault.getAbstractFileByPath(this.filePath);
    let file: TFile | null = null;

    if (abstractFile instanceof TFile) {
      file = abstractFile;
    } else {
      // 尝试不区分大小写查找
      const allFiles = vault.getFiles();
      file = allFiles.find(f => f.path.toLowerCase() === this.filePath.toLowerCase()) || null;
    }

    // 如果找不到，尝试创建
    if (!file) {
      await this.createDefaultFile();
      abstractFile = vault.getAbstractFileByPath(this.filePath);
      if (abstractFile instanceof TFile) {
        file = abstractFile;
      }
    }

    return file!;
  }

  private async createDefaultFile(): Promise<void> {
    const vault = this.app.vault;

    // 检查父目录是否存在
    const lastSlashIndex = this.filePath.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const parentDir = this.filePath.substring(0, lastSlashIndex);
      const parent = vault.getAbstractFileByPath(parentDir);
      if (!parent) {
        await vault.createFolder(parentDir);
      }
    }

    // 创建空内容
    const initialContent = this.serializer.serialize([]);
    try {
      await vault.create(this.filePath, initialContent);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        return;
      }
      throw e;
    }
  }
}
