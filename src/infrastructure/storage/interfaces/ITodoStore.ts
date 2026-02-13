/**
 * 待办事项存储接口
 * 定义数据持久化的抽象接口
 */

import { TodoItemData } from '@/domain/types';

export interface ITodoStore {
  /**
   * 读取所有待办事项
   */
  readAll(): Promise<TodoItemData[]>;

  /**
   * 保存所有待办事项
   */
  saveAll(todos: TodoItemData[]): Promise<void>;

  /**
   * 监听文件变化
   * @returns 取消监听的函数
   */
  watch(callback: () => void): () => void;

  /**
   * 获取文件路径
   */
  getFilePath(): string;

  /**
   * 初始化存储
   */
  initialize(): Promise<void>;
}
