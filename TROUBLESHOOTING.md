# Troubleshooting Guide

## Issue 1: Import Path Aliases Not Working

### Symptom
```
Failed to resolve import "@pages/NodeTester" from "src/App.tsx"
```

### Solution
✅ **FIXED** - Added `@pages` alias to both `tsconfig.json` and `vite.config.ts`

**After fixing, you MUST:**
1. Stop the dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. If still not working, clear cache: `rm -rf node_modules/.vite` then restart

---

## Issue 2: VS Code Not Showing TypeScript Errors Globally

### Symptoms
- Errors only show when file is open
- Errors disappear when navigating away
- PROBLEMS panel is empty even with errors

### Solutions

#### Solution 1: Restart TypeScript Server (Quick Fix)
1. Open Command Palette: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: `TypeScript: Restart TS Server`
3. Press Enter
4. Wait 5-10 seconds for TypeScript to re-index

#### Solution 2: Select TypeScript Version
1. Open any `.ts` or `.tsx` file
2. Look at bottom-right of VS Code status bar
3. Click on TypeScript version number (e.g., "TypeScript 5.2.2")
4. Select "Use Workspace Version"
5. Restart TS server (Solution 1)

#### Solution 3: Reload VS Code Window
1. Command Palette: `Ctrl+Shift+P`
2. Type: `Developer: Reload Window`
3. Press Enter

#### Solution 4: Check TypeScript is Working
1. Open Command Palette
2. Type: `TypeScript: Go to Project Configuration`
3. Should open `tsconfig.json`
4. If error or doesn't open, TypeScript server is not running

#### Solution 5: Clear TypeScript Cache
```bash
# In terminal, from project root:
rm -rf node_modules/.vite
rm -rf .tsbuildinfo
rm -rf tsconfig.tsbuildinfo
npm run dev
```

#### Solution 6: VS Code Settings (Already Applied)
✅ Created `.vscode/settings.json` with optimal TypeScript configuration

Check these settings are active:
- Open Settings: `Ctrl+,`
- Search: `typescript.validate.enable`
- Should be checked ✓

---

## Issue 3: Hot Module Replacement (HMR) Not Working

### Symptom
- Changes don't reflect in browser
- Need to manually refresh

### Solution
1. Check Vite server is running
2. Look for errors in terminal
3. Try hard refresh: `Ctrl+Shift+R`
4. If broken, restart dev server

---

## Issue 4: Module Not Found After Creating New Files

### Symptom
```
Cannot find module '@components/MyNewComponent'
```

### Solution
**TypeScript doesn't auto-detect new files immediately**

1. Save the new file
2. Restart TypeScript server (see Solution 1 above)
3. Or just restart dev server

---

## Issue 5: "Cannot find name" Errors for Imported Types

### Symptom
```
Cannot find name 'NodeType'
```

### Solution
Make sure imports use correct path alias:
```typescript
// ❌ Wrong
import { NodeType } from '../types'

// ✅ Correct
import { NodeType } from '@types/index'
```

---

## Checklist Before Starting Development

Run these steps if you encounter issues:

- [ ] Dev server is running: `npm run dev`
- [ ] No terminal errors
- [ ] TypeScript version selected: "Use Workspace Version"
- [ ] Restarted TS server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- [ ] VS Code settings file exists: `.vscode/settings.json`
- [ ] Browser console has no errors (F12)

---

## Common Commands

### Restart Everything (Nuclear Option)
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

Then in VS Code:
1. Restart TS Server
2. Reload Window

### Check What's Running
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

---

## Still Having Issues?

1. **Check Node version**: `node --version` (should be 18+)
2. **Check npm version**: `npm --version` (should be 9+)
3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```
4. **Check for Windows path issues**: Paths should use forward slashes `/` in code
5. **Check antivirus**: Sometimes blocks HMR websockets

---

## TypeScript Error Reference

### "Cannot find module"
→ Path alias not configured or TS server not restarted

### "Type 'X' is not assignable to type 'Y'"
→ Check type definitions in `src/types/index.ts`

### "Property does not exist on type"
→ Type definition incomplete, add missing property

### "Argument of type 'X' is not assignable"
→ Check function signature vs. what you're passing

---

## Quick Diagnostic

Run this in terminal from project root:
```bash
# Check TypeScript can compile
npx tsc --noEmit

# Should show any errors across entire project
```

If this shows errors but VS Code doesn't, your VS Code TypeScript integration is broken.

Solution: Restart TS Server + Reload Window
