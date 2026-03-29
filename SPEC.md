# 3D Modeling Web Tool - Technical Specification

> Based on 3dModel.md requirements
> Created: 2026-03-29

---

## 1. Project Overview

### 1.1 Core Functionality
Browser-based 3D modeling tool allowing users to create, edit, manage, and share 3D models without installing any software.

### 1.2 Target Users
- Designers, architects, engineers needing lightweight 3D modeling
- Teachers and students in educational settings

### 1.3 Tech Stack
| Category | Technology |
|----------|------------|
| Frontend Framework | Next.js + TypeScript |
| 3D Rendering | Three.js + React-Three-Fiber + Drei |
| Boolean Operations | three-bvh-csg |
| State Management | Zustand |
| Backend/Database | Supabase (Auth + PostgreSQL + Storage) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## 2. UI/UX Specification

### 2.1 Layout Structure

```
┌──────────────────────────────────────────────────────┐
│                     顶部工具栏                        │
│                   (100% × 56px)                      │
├────────────────┬─────────────────────────────────────┤
│                │                                     │
│   左侧模型树    │           右侧主画布区域             │
│   (~20%宽)     │           (~80%宽)                  │
│                │                                     │
│   模型列表     │         3D Canvas                   │
│   + 属性面板   │                                     │
│                │                                     │
└────────────────┴─────────────────────────────────────┘
```

### 2.2 Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background (Dark) | Charcoal | #1a1a2e |
| Surface | Dark Slate | #16213e |
| Primary | Electric Blue | #0f4c75 |
| Accent | Cyan | #00d9ff |
| Text Primary | White | #ffffff |
| Text Secondary | Gray | #a0a0a0 |
| Success | Green | #00c853 |
| Warning | Orange | #ff9100 |
| Error | Red | #ff5252 |
| Canvas BG | Near Black | #0a0a0f |

### 2.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headers | Inter | 18-24px | 600 |
| Body | Inter | 14px | 400 |
| Labels | Inter | 12px | 500 |
| Monospace | JetBrains Mono | 12px | 400 |

### 2.4 Spacing System
- Base unit: 4px
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

### 2.5 Components

#### Toolbar
- Height: 56px
- Background: Surface (#16213e)
- Border-bottom: 1px solid rgba(255,255,255,0.1)
- Tool buttons: 40×40px with hover highlight

#### Model Tree Panel
- Width: ~20% (min 250px, max 400px)
- Background: Surface (#16213e)
- Tree nodes: 32px height
- Icons: 16×16px

#### Properties Panel
- Positioned below or side of model tree
- Collapsible sections
- Input fields: 32px height

#### 3D Canvas
- Background: Canvas BG (#0a0a0f)
- Grid: 20×20 units, color rgba(255,255,255,0.1)
- Axes: RGB for XYZ (red, green, blue)

---

## 3. Functionality Specification

### 3.1 Drawing Tools

| Tool | Icon | Description |
|------|------|-------------|
| Continuous Line | / | Click to add points, double-click to end |
| Bezier Curve | ~ | Click for control points, drag handles to adjust |
| Sphere | ○ | Click to place, set radius in properties |
| Cylinder | ⬭ | Click to place, set radius/height in properties |
| Cube | □ | Click to place, set dimensions in properties |
| Prism | ⬡ | N-sided prism, click to place |
| Polygon | ⯁ | Click vertices, close by clicking first point |

### 3.2 Model Operations

| Operation | Description |
|-----------|-------------|
| Union | Merge selected models into one |
| Subtract | Cut one model with another (CSG) |
| Select/Move | Click to select, drag to move |
| Rotate | Rotate around X/Y/Z axes |
| Scale | Uniform or per-axis scaling |

### 3.3 View Controls

| Control | Action |
|---------|--------|
| Left-drag | Orbit camera |
| Right-drag | Pan camera |
| Scroll | Zoom in/out |
| Double-click model | Focus camera on model |

### 3.4 User Authentication

- Email/password registration with Supabase Auth
- Email verification required
- Password reset via email
- Avatar upload to Supabase Storage

### 3.5 Project Management

- Create new projects
- Save projects (JSON serialization to Supabase)
- Auto-save option (configurable interval)
- Open existing projects
- Delete projects (with confirmation)
- Rename projects

### 3.6 Sharing

- Share with other users by email
- Permission levels: View / Edit
- "Shared with me" project list

---

## 4. Database Schema

### 4.1 Tables

```sql
-- profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  scene_data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- project_shares
create table project_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  shared_with uuid references profiles(id),
  permission text check (permission in ('view', 'edit')) default 'view',
  created_at timestamptz default now(),
  unique(project_id, shared_with)
);
```

### 4.2 Row Level Security
- projects: Owner can CRUD; shared users have read/write based on permission
- project_shares: Only owner can create/delete shares
- profiles: Public read for user search; only self can update

---

## 5. Scene Data Format

```typescript
interface SceneData {
  project_id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  scene: {
    camera: {
      position: [number, number, number];
      target: [number, number, number];
    };
    settings: {
      showGrid: boolean;
      showAxes: boolean;
    };
    objects: SceneObject[];
  };
}

interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'prism' | 'line' | 'curve' | 'polygon' | 'group';
  geometry: Record<string, number | number[]>;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  material: {
    color: string;
    opacity: number;
    type: 'standard' | 'metal' | 'glass' | 'emissive';
    wireframe: boolean;
  };
  visible: boolean;
  children?: SceneObject[];
}
```

---

## 6. Performance Requirements

| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds |
| Model operation response | < 100ms |
| Max objects per project | 200+ |

---

## 7. Development Phases

| Phase | Content |
|-------|---------|
| Phase 1 | Project init, basic page structure, Three.js integration, basic primitives |
| Phase 2 | Model tree, properties panel, view controls, axes/grid |
| Phase 3 | Boolean operations (union/subtract), transform gizmo |
| Phase 4 | Supabase integration, auth, user profiles |
| Phase 5 | Project CRUD, sharing |
| Phase 6 | Testing, optimization, deployment |

---

## 8. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 9. Key Files Structure

```
3dModel/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── canvas/
│   │   │   └── SceneCanvas.tsx
│   │   ├── toolbar/
│   │   │   └── Toolbar.tsx
│   │   ├── model-tree/
│   │   │   ├── ModelTree.tsx
│   │   │   └── ModelNode.tsx
│   │   └── properties/
│   │       └── PropertiesPanel.tsx
│   ├── stores/
│   │   └── sceneStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── types.ts
│   └── hooks/
│       └── useAuth.ts
├── feature_list.json
├── claude-progress.txt
├── init.sh
└── SPEC.md
```

---

*End of SPEC.md*
