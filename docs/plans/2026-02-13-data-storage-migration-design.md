# 数据存储迁移设计

## 概述

将待办事项数据从用户可见的 Markdown 文件迁移到插件配置目录下的 JSON 文件。

**动机**：避免数据文件出现在用户的正常浏览视图中，提供更清晰的用户体验。

**影响范围**：破坏性更新，不保留现有 YAML 数据。

## 存储架构

### 文件位置

```
{vault}/.obsidian/plugins/obsidian-tasks-plugin/
├── data.json      # 主数据文件
└── data.json.bak  # 自动备份文件
```

### 数据格式

```json
{
  "version": "1.0.0",
  "lastModified": "2024-01-15T10:30:00.000Z",
  "todos": [
    {
      "id": "1705315800000",
      "title": "示例任务",
      "description": "",
      "completed": false,
      "priority": "medium",
      "dueDate": null,
      "tags": [],
      "linkedNote": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 核心变更

### TodoService 修改

| 方法 | 变更 |
|------|------|
| `loadFromFile()` | 从插件配置目录读取 JSON，增加备份恢复逻辑 |
| `saveToFile()` | 写入 JSON 格式，保存前创建备份 |
| `createDefaultFile()` | 在插件配置目录创建空 JSON 文件 |
| `serializeContent()` | 删除，改用 `JSON.stringify()` |
| `parseContent()` | 删除，改用 `JSON.parse()` |
| `objectToYaml()` | 删除 |
| `yamlToObject()` | 删除 |

### 新增方法

- `getDataFilePath(): string` - 返回 `data.json` 完整路径
- `getBackupFilePath(): string` - 返回备份文件路径
- `createBackup(): Promise<void>` - 创建备份文件
- `restoreFromBackup(): Promise<boolean>` - 从备份恢复

## 数据流

### 读取流程

```
initialize()
  └── loadFromFile()
      ├── 尝试读取 data.json
      │   ├── 成功 → 解析 JSON → 加载到内存
      │   └── 失败 → 尝试从 data.json.bak 恢复
      │       ├── 恢复成功 → 解析备份 → 加载到内存
      │       └── 恢复失败 → 创建空的 data.json
      └── 触发更新通知
```

### 写入流程

```
addTodo() / updateTodo() / deleteTodo()
  └── saveToFile()
      ├── 1. 创建备份 (data.json → data.json.bak)
      ├── 2. 序列化为 JSON
      ├── 3. 写入 data.json
      └── 4. 失败时显示 Notice 通知
```

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| JSON 解析失败 | 尝试恢复备份，失败则创建空文件 + Notice 提示 |
| 写入权限不足 | Notice 显示错误信息，保留内存数据 |
| 插件目录不存在 | 自动创建目录结构 |
| 备份失败 | 记录警告日志，继续主流程 |

## 设置与兼容性

### 设置界面变更

- 移除 `TodoPluginSettings.todoFilePath` 字段
- 移除"待办事项文件路径"设置项
- 可选：添加"重置数据"按钮

### 版本升级

- `manifest.json` 版本号：`7.22.0` → `8.0.0`
- 不做数据迁移，旧用户升级后丢失 YAML 数据

## 实现要点

### 获取插件配置目录

```typescript
const pluginDir = this.app.vault.configDir + '/plugins/obsidian-tasks-plugin';
const dataPath = `${pluginDir}/data.json`;
```

### JSON 序列化

```typescript
private serializeContent(): string {
  return JSON.stringify({
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    todos: this.todos.map(t => t.toObject())
  }, null, 2);
}
```

### 备份逻辑

```typescript
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
```

## 测试验证

1. 首次安装 - 验证 `data.json` 自动创建
2. 基本 CRUD - 添加、编辑、删除、完成待办事项
3. 备份恢复 - 损坏 `data.json`，验证从 `.bak` 恢复
4. 多 vault - 确认每个 vault 数据独立存储
5. 文件不可见 - Obsidian 文件浏览器中确认隐藏
