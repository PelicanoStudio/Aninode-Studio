# Roadmap: Converting Aninode to an Open Source Library

This document outlines the steps to transform the current Aninode Design System application into a reusable, distributable npm library.

## 1. Architecture Refactoring

The goal is to separate the **Core Logic** (State, Math, Interaction) from the **Implementation** (The specific App we built).

### A. State Management (The "Brain")

Currently, `App.tsx` holds all the state (`nodes`, `connections`, `viewport`, `history`).
**Action:** Move this state into a dedicated Store or Context.

- **Recommendation:** Use **Zustand** or **React Context**.
- **Create:** `useAninodeStore()` hook.
- **Expose Methods:** `addNode()`, `connect()`, `undo()`, `setTheme()`.

### B. Component API

Users should be able to compose the editor.
**Example Usage for End-Users:**

```tsx
import { AninodeCanvas, Background, Controls, MiniMap } from "aninode";

function MyEditor() {
  return (
    <AninodeCanvas
      initialNodes={[]}
      theme="oled-dark"
      onNodeAdd={(node) => console.log("Node added", node)}
    >
      <Background type="dots" />
      <Controls />
      <MiniMap />
    </AninodeCanvas>
  );
}
```

### C. Custom Node Registration

Allow users to define their own nodes.
**Action:** Create a registry system.

```tsx
const nodeTypes = {
  'my-custom-node': MyCustomComponent,
  'oscillator': OscillatorNode
};

<AninodeCanvas nodeTypes={nodeTypes} ... />
```

## 2. Build Configuration (Vite Library Mode)

We need to configure Vite to bundle the code into a format that other projects can use (ESM and CJS).

**Update `vite.config.ts`:**

```typescript
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts"; // For TypeScript types

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.ts"), // Main entry point
      name: "Aninode",
      fileName: "aninode",
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [dts()], // Generates .d.ts files
});
```

## 3. Project Structure Reorganization

```
/src
  /lib              <-- The Library Code
    /components     (Canvas, Node, Wire, etc.)
    /hooks          (useSelection, useDrag, etc.)
    /utils          (math, geometry)
    index.ts        (Exports everything)
  /demo             <-- The current App.tsx (Testing ground)
    App.tsx
```

## 4. Configuration & Customization

Create a configuration object that users can pass to override defaults.

```typescript
interface AninodeConfig {
  shortcuts?: {
    undo?: string; // 'ctrl+z'
    delete?: string;
  };
  connectionRules?: {
    allowLoops?: boolean;
    maxConnectionsPerPort?: number;
  };
  theme?: {
    colors: {
      accent: string;
      background: string;
    };
  };
}
```

## 5. Publishing to NPM

1.  **Prepare `package.json`**:
    ```json
    {
      "name": "aninode-design-system",
      "version": "1.0.0",
      "main": "./dist/aninode.umd.js",
      "module": "./dist/aninode.js",
      "types": "./dist/index.d.ts",
      "exports": {
        ".": {
          "import": "./dist/aninode.js",
          "require": "./dist/aninode.umd.js"
        }
      },
      "peerDependencies": {
        "react": "^18.0.0"
      }
    }
    ```
2.  **Login**: `npm login`
3.  **Publish**: `npm publish`

## 6. CDN Distribution

Once published to npm, it is automatically available via CDNs like **unpkg** or **jsdelivr**.

**Usage via CDN:**

```html
<script src="https://unpkg.com/aninode-design-system@1.0.0/dist/aninode.umd.js"></script>
<script>
  const { AninodeCanvas } = window.Aninode;
  // Initialize...
</script>
```
