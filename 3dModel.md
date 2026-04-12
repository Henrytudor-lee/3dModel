# 3D 建模网页工具 — 项目需求文档

> 版本：v1.0  
> 最后更新：2026-03-29  
> 技术栈建议：Nextjs + Three.js / Babylon.js + Supabase

---

## 1. 项目概述

### 1.1 项目简介

开发一款基于浏览器的 3D 建模网页工具，用户无需安装任何本地软件，即可在浏览器中完成三维模型的创建、编辑、管理与分享。

### 1.2 目标用户

- 设计师、建筑师、工程师等需要轻量级 3D 建模能力的专业用户
- 教育场景中需要可视化 3D 内容的师生

### 1.3 核心价值

- 零安装、跨平台，打开浏览器即用
- 实时 3D 渲染与交互操作
- 云端数据存储与工程分享协作

---

## 2. 整体页面结构

页面分为三个固定区域：

```
┌──────────────────────────────────────────────────────┐
│                     顶部工具栏                        │
├────────────────┬─────────────────────────────────────┤
│                │                                     │
│   左侧模型树   │           右侧主画布区域             │
│                │                                     │
│                │                                     │
└────────────────┴─────────────────────────────────────┘
```

| 区域 | 占比（参考） | 功能职责 |
|------|-------------|---------|
| 顶部工具栏 | 100% 宽 × 固定高度 | 绘制工具、操作工具、视图设置 |
| 左侧模型树 | ~20% 宽 | 模型列表与属性设置 |
| 右侧画布 | ~80% 宽 | 3D 渲染主区域、用户交互 |

---

## 3. 功能详细需求

### 3.1 顶部工具栏

#### 3.1.1 绘制工具

| 工具名称 | 说明 |
|---------|------|
| 连续线条 | 用户在画布中点击连续绘制折线段，双击结束 |
| 曲线 | 支持贝塞尔曲线绘制，可拖拽控制柄调整曲率 |
| 球体 | 点击画布放置球体，可设置初始半径 |
| 圆柱体 | 点击放置圆柱体，可设置半径与高度 |
| 立方体 | 点击放置立方体，可设置长宽高 |
| 棱柱体 | 支持 N 边形棱柱，可设置边数与高度 |
| 多边形 | 在画布上依次点击顶点，闭合后生成平面多边形 |

#### 3.1.2 模型操作工具

| 工具名称 | 说明 |
|---------|------|
| 合并（Union） | 将选中的多个模型合并为一个整体 |
| 切割（Subtract） | 用一个模型切割另一个模型，生成差集结果 |
| 选择 / 移动 | 点选模型，拖拽进行位移 |
| 旋转 | 对选中模型进行旋转变换 |
| 缩放 | 对选中模型进行等比或非等比缩放 |

#### 3.1.3 视图与辅助设置

| 设置项 | 说明 |
|--------|------|
| 坐标轴 | 开关控制：是否在画布中显示 X/Y/Z 坐标轴指示器 |
| 辅助网格线 | 开关控制：是否显示地面参考网格 |
| 视角预设 | 可切换顶视、前视、侧视、透视等预设视角 |

---

### 3.2 左侧模型树

#### 3.2.1 模型列表

- 以树形结构展示当前工程中所有模型对象
- 支持嵌套层级（如合并后的组合模型）
- 每个节点显示模型名称与类型图标
- 支持节点重命名（双击）
- 支持节点拖拽排序
- 支持节点显示/隐藏切换（眼睛图标）
- 支持节点删除

#### 3.2.2 模型属性面板

点击模型节点后，在模型树下方或侧边展开属性面板，可设置：

| 属性 | 类型 | 说明 |
|------|------|------|
| 名称 | 文本输入 | 模型自定义名称 |
| 颜色 | 颜色选择器 | 模型表面颜色 |
| 透明度 | 滑块 0–100% | 控制模型透明程度 |
| 材质 | 下拉选择 | 如标准、金属、玻璃、自发光等 |
| 位置 (X/Y/Z) | 数值输入 | 精确设置模型坐标 |
| 旋转 (X/Y/Z) | 数值输入 | 精确设置旋转角度（度） |
| 缩放 (X/Y/Z) | 数值输入 | 精确设置缩放比例 |
| 线框模式 | 开关 | 是否以线框渲染该模型 |

---

### 3.3 右侧主画布区域

#### 3.3.1 渲染

- 使用 WebGL 进行实时 3D 渲染（推荐 Three.js 或 Babylon.js）
- 支持环境光、方向光基础光照
- 支持阴影（可选开关，考虑性能）
- 支持反射/折射材质预览

#### 3.3.2 视角交互

| 操作 | 行为 |
|------|------|
| 左键拖拽 | 旋转摄像机视角（轨道控制） |
| 右键拖拽 | 平移摄像机 |
| 滚轮 | 缩放（推拉镜头） |
| 双击模型 | 聚焦至该模型 |

#### 3.3.3 模型交互

- 点击选中模型，选中高亮显示
- 选中模型后显示变换控件（Gizmo：移动/旋转/缩放轴向手柄）
- 支持多选（Shift/Ctrl + 点击）

---

### 3.4 用户系统

#### 3.4.1 注册 / 登录

- 支持邮箱 + 密码注册与登录
- 使用 Supabase Auth 实现认证
- 支持邮箱验证
- 支持密码重置（发送重置邮件）

#### 3.4.2 用户信息

| 字段 | 类型 | 说明 |
|------|------|------|
| 头像 | 图片文件 | 上传至 Supabase Storage |
| 名称 | 文本 | 用户显示名 |
| 邮箱 | 文本 | 账号唯一标识 |
| 密码 | 加密存储 | 由 Supabase Auth 管理 |

---

### 3.5 工程管理

#### 3.5.1 工程操作

| 操作 | 说明 |
|------|------|
| 新建工程 | 创建空白工程，输入工程名称 |
| 保存工程 | 将当前画布状态序列化为 JSON 存储至 Supabase |
| 自动保存 | 可选：每隔 N 分钟自动保存（或检测变更后提示） |
| 打开工程 | 从工程列表选择已有工程载入 |
| 删除工程 | 删除指定工程（需二次确认） |
| 重命名工程 | 修改工程名称 |

#### 3.5.2 工程数据结构（JSON Schema 参考）

```json
{
  "project_id": "uuid",
  "owner_id": "uuid",
  "name": "工程名称",
  "created_at": "ISO8601",
  "updated_at": "ISO8601",
  "scene": {
    "camera": { "position": [x, y, z], "target": [x, y, z] },
    "settings": {
      "showGrid": true,
      "showAxes": true
    },
    "objects": [
      {
        "id": "uuid",
        "name": "Cube_01",
        "type": "box",
        "geometry": { "width": 1, "height": 1, "depth": 1 },
        "transform": {
          "position": [0, 0, 0],
          "rotation": [0, 0, 0],
          "scale": [1, 1, 1]
        },
        "material": {
          "color": "#ffffff",
          "opacity": 1.0,
          "type": "standard",
          "wireframe": false
        },
        "visible": true,
        "children": []
      }
    ]
  }
}
```

---

### 3.6 工程分享

#### 3.6.1 分享功能

- 已登录用户可将工程分享给平台内的其他指定用户
- 分享时，输入目标用户的邮箱或用户名进行检索
- 支持设置分享权限：**只读（View）** / **可编辑（Edit）**
- 被分享用户可在"与我共享"列表中查看接收的工程

#### 3.6.2 分享数据结构

```
project_shares 表：
- share_id (uuid, PK)
- project_id (uuid, FK → projects)
- owner_id (uuid, FK → users)
- shared_with_user_id (uuid, FK → users)
- permission (enum: 'view' | 'edit')
- created_at (timestamp)
```

---

## 4. 数据库设计（Supabase）

### 4.1 主要数据表

#### users（由 Supabase Auth 管理 + 扩展表）

```sql
-- 扩展表 profiles
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);
```

#### projects

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  scene_data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### project_shares

```sql
create table project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  shared_with uuid references profiles(id),
  permission text check (permission in ('view', 'edit')) default 'view',
  created_at timestamptz default now(),
  unique(project_id, shared_with)
);
```

### 4.2 Row Level Security（RLS）策略要点

- `projects`：用户只能读写自己的工程；被分享用户按权限读取
- `project_shares`：仅工程所有者可创建/删除分享记录
- `profiles`：登录用户可读取所有 profiles（用于搜索用户），仅本人可修改自己的 profile

---

## 5. 技术选型建议

| 类别 | 推荐方案 |
|------|---------|
| 前端框架 | Nextjs+ TypeScript |
| 3D 渲染 | Three.js（或 Babylon.js） |
| 3D 布尔运算 | three-bvh-csg（Three.js CSG 插件） |
| 状态管理 | Zustand 或 Jotai |
| 后端 / 数据库 | Supabase（Auth + PostgreSQL + Storage） |
| 样式 | Tailwind CSS |
| 构建工具 | Vite |
| 部署 | Vercel |

---

## 6. 非功能性需求

### 6.1 性能

- 画布初始加载时间 < 3 秒
- 模型操作响应延迟 < 100ms（中等复杂度场景）
- 单工程支持不少于 200 个模型对象

### 6.2 安全

- 所有 API 请求须携带 Supabase JWT 令牌
- 存储桶（头像图片）仅允许已认证用户上传，公开读取
- 工程数据严格按 RLS 隔离，禁止越权访问

### 6.3 兼容性

- 支持 Chrome、Edge、Firefox、Safari 最新两个主版本
- 最低要求支持 WebGL 1.0，推荐 WebGL 2.0
- 响应式布局支持（最小分辨率 1280×720）

### 6.4 可扩展性

- 模型类型（geometry type）使用枚举注册机制，便于后续新增图元
- 工具栏按钮通过配置化方式注册，便于扩展

---

## 7. 开发阶段规划（参考）

| 阶段 | 内容 |
|------|------|
| Phase 1 | 项目初始化、基础页面结构、Three.js 画布接入、基本图元绘制 |
| Phase 2 | 模型树、属性面板、视图控制（旋转/平移/缩放）、坐标轴/网格线 |
| Phase 3 | 布尔运算（合并/切割）、变换 Gizmo |
| Phase 4 | Supabase 接入、用户注册/登录/个人信息 |
| Phase 5 | 工程管理（新建/保存/打开/删除）、工程分享 |
| Phase 6 | 联调测试、性能优化、部署上线 |

---

## 8. 待确认事项

- [ ] 是否需要支持导入/导出模型文件（如 .obj、.glb、.stl）？
- [ ] 工程分享是否需要生成公开链接（无需登录即可查看）？
- [ ] 是否需要版本历史（工程快照 / 撤销重做的服务端持久化）？
- [ ] 移动端是否需要触屏支持？
- [x] 是否需要多语言国际化（i18n）？

---

*文档结束*
