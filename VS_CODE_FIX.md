# Complete VS Code Fix (TypeScript + ESLint)

## The Problem
TypeScript and ESLint errors only show when files are open, and disappear when you navigate away.

## Root Causes
1. TypeScript server not watching all files
2. ESLint extension not running on workspace
3. VS Code cache corrupted
4. Extension conflicts

---

## ✅ COMPLETE FIX (Do ALL steps in order)

### Step 1: Update VS Code Extensions

1. Open VS Code Extensions: `Ctrl+Shift+X`
2. Search for and **UPDATE** these extensions:
   - **ESLint** (by Microsoft)
   - **TypeScript and JavaScript Language Features** (built-in)
3. **Restart VS Code** after updating

### Step 2: Clear ALL Caches

```bash
# In project terminal:
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# Windows PowerShell (run as admin):
Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"
```

### Step 3: Reinstall Dependencies

```bash
npm ci
# or if that fails:
rm -rf node_modules package-lock.json
npm install
```

### Step 4: Reload VS Code Workspace

1. `Ctrl+Shift+P`
2. Type: `Developer: Reload Window`
3. Wait for full reload

### Step 5: Select Workspace TypeScript

1. Open any `.tsx` file
2. Click TypeScript version in bottom-right (e.g., "5.2.2")
3. Select **"Use Workspace Version"**
4. Should see: "Using TypeScript 5.2.2 from node_modules"

### Step 6: Restart TypeScript Server

1. `Ctrl+Shift+P`
2. Type: `TypeScript: Restart TS Server`
3. Wait 10 seconds
4. Check Output panel: `View > Output` → Select "TypeScript"
5. Should see: "Starting TypeScript Server..."

### Step 7: Restart ESLint Server

1. `Ctrl+Shift+P`
2. Type: `ESLint: Restart ESLint Server`
3. Check Output panel: Select "ESLint"
4. Should see: "ESLint server is running"

### Step 8: Force Full Validation

1. `Ctrl+Shift+P`
2. Type: `TypeScript: Open TS Server Log`
3. You should see activity (it's working!)

Then:
1. `Ctrl+Shift+P`
2. Type: `Developer: Show Running Extensions`
3. Verify ESLint and TypeScript are listed

### Step 9: Verify It's Working

**Test 1: Create intentional error**
```typescript
// In any .tsx file, add this:
const test: string = 123 // Should show red squiggle
```

**Test 2: Check PROBLEMS panel**
1. `Ctrl+Shift+M` (open PROBLEMS)
2. Should show the error
3. Navigate to different file
4. Error should STAY in PROBLEMS panel

**Test 3: ESLint error**
```typescript
// Add unused variable:
const unused = 'test' // Should show yellow warning
```

---

## 🔍 Diagnostic Commands

### Check if TypeScript is compiling:
```bash
npx tsc --noEmit
```
Should show all TS errors across project.

### Check if ESLint is working:
```bash
npx eslint src/ --ext .ts,.tsx
```
Should show all ESLint errors.

### Check VS Code Extension Host:
1. `Ctrl+Shift+P`
2. Type: `Developer: Show Logs`
3. Select "Extension Host"
4. Look for errors

---

## 🚨 Still Not Working?

### Nuclear Option: Reset VS Code Workspace

```bash
# Close VS Code completely
# Delete workspace files:
rm -rf .vscode
rm -rf node_modules

# Recreate:
npm install

# In VS Code:
# File > Open Folder > Select project
# Follow steps 1-9 again
```

### Check for Extension Conflicts

Some extensions interfere with TypeScript/ESLint:
1. Disable ALL extensions: `Ctrl+Shift+P` → "Disable All Extensions"
2. Reload window
3. Re-enable ONLY:
   - ESLint
   - TypeScript and JavaScript Language Features
4. Test if errors show
5. Re-enable other extensions one by one

### Alternative: Use Command Line

If VS Code still won't show errors, use terminal instead:

**Watch for TypeScript errors:**
```bash
npx tsc --noEmit --watch
```

**Watch for ESLint errors:**
```bash
npx eslint src/ --ext .ts,.tsx --watch
```

Keep these running in terminal while developing.

---

## ⚙️ Settings That Matter

These settings are now in `.vscode/settings.json`:

```json
{
  "typescript.validate.enable": true,
  "eslint.run": "onType",
  "problems.autoReveal": true
}
```

If still not working, try:
```json
{
  "typescript.tsserver.log": "verbose",
  "eslint.debug": true
}
```

Then check Output panel for clues.

---

## 💡 Pro Tips

1. **Keep terminal open** - Run `npx tsc --noEmit` in watch mode
2. **Check Output panels** - View > Output, switch between TypeScript/ESLint
3. **Use Extensions sidebar** - Right-click extension > "Disable (Workspace)" to test
4. **Update VS Code** - Help > Check for Updates

---

## ✅ Expected Behavior After Fix

- [ ] PROBLEMS panel shows all errors from entire project
- [ ] Errors persist when navigating between files
- [ ] TypeScript errors appear as you type (red squiggles)
- [ ] ESLint warnings appear as you type (yellow squiggles)
- [ ] Output > TypeScript shows server running
- [ ] Output > ESLint shows server running
- [ ] `npx tsc --noEmit` matches what VS Code shows

---

## 🆘 Last Resort

If NOTHING works, it might be a VS Code installation issue:

1. **Uninstall VS Code completely**
2. **Delete config folders:**
   - Windows: `%APPDATA%\Code`
   - Mac: `~/Library/Application Support/Code`
   - Linux: `~/.config/Code`
3. **Reinstall VS Code from official site**
4. **Reinstall extensions**
5. **Open project folder**
6. **Follow steps 1-9 again**

---

Good luck! 🍀
