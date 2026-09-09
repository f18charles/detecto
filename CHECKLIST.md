# DETECTO REFACTORED - IMPLEMENTATION CHECKLIST & WORKFLOW RULES

## 🚨 Git & Workflow Rules (Strictly Enforced)

### 1. Branch Strategy
- **Current Branch**: `styling-and-structure`
  - Purpose: Purely for styling, layout, CRT animations, component decomposition, and UI structure.
- **Phase 2 Branch**: `api-integration`
  - Action: Create `api-integration` by branching off `styling-and-structure` when starting Phase 2.
  - Command: `git checkout -b api-integration`

### 2. Push & Remote Rules
- **DO NOT PUSH TO REMOTE**: Never execute `git push` or attempt remote sync. The user handles all remote pushes. Attempting `git push` will fail.

### 3. Commit Guidelines
- Use **Conventional, Descriptive Commit Messages**:
  - `feat: add product repository` / `feat: implement power store and boot sequence`
  - `fix: prevent negative stock` / `fix: resolve toastKey remount issue`
  - `test: add inventory service tests`
  - `refactor: separate sale business logic` / `refactor: extract modular Zustand stores`
- **DO NOT COMMIT**:
  - `.env` or credential/secret files
  - Build artifacts (`dist/`, `build/`, `node_modules/`)
  - IDE configuration files (`.vscode/`, `.idea/`)
  - Temporary files or scratch scripts (`/scratch`, `*.tmp`)

### 4. External Reference & Feature Extraction
- **Reference Source**: `../lookout.zip` (located in `/home/fcharles/Downloads/detecto-dev/lookout.zip`).
- **Action**: Extract or inspect features from `lookout.zip` when porting enhanced UI capabilities.

---

## 🎨 Phase 1: Styling & Structure (`styling-and-structure` branch)

### Architectural Integrity (Keep Clean Patterns)
- [x] **Modular Zustand Stores**: Keep domain-separated stores (`NavigationStore.js`, `DetectionStore.js`, `PowerStore.js`). Never collapse into one giant `useConsoleStore.js`.
- [x] **Modular Screen Components**: Preserve decomposed UI components (`ConsoleShell`, `ScreenBezel`, `TerminalText`, `ResultView`, `SceneCanvas`, `BoundingBox`, etc.). Avoid 360-line monolith `ScreenTerminal.jsx` with giant `renderContent()` branching.
- [x] **No Static `useQuery` Wrappers**: Direct static handling for local demo assets without useless `useQuery` wrappers (`useSampleImagesQuery`/`useHistoryQuery`).
- [x] **Bundled Local Samples**: Preserve locally bundled demo images in `frontend/public/samples/` for offline availability. Never hotlink Unsplash URLs.
- [x] **Reusable Components**: Maintain reusable `StatScreen`/`StatCard` component for stats rail instead of copy-pasting JSX blocks.
- [x] **Shared Clock Hook**: Preserve shared `useClock` hook in `DirectionsPanel`. Do not duplicate inline `useState` + `setInterval`.
- [x] **Keyboard Navigation**: Support Up/Down AND Left/Right arrow keys, Enter, Space, Escape, Backspace.
- [x] **5-Pass Toast Animation**: Keep explicit 5-iteration marquee scroll requirement (`animation: toastMarquee 3.2s linear 5`).
- [x] **No Dead Stub Files**: Omit dead stub files like `ScreenHeader.jsx` or `ScreenFooter.jsx`.

### Unconditional Removals (Non-negotiable)
- [x] **Audio Removed**: Zero Web Audio API calls, sound effects, `playPowerOnSound`, or `services/audio.js`.
- [x] **Tailwind v3 Discarded**: Pure Tailwind v4 setup via `@import "tailwindcss";` without legacy `tailwind.config.js`, `postcss.config.js`, `@tailwind` directives, or v3 devDependencies.
- [x] **No Duplicated Structural CSS**: Discard handwritten CSS classes (`.console-grid`, `.stats-rail`, `.icon-rail`, `.top-bar`). Use Tailwind v4 utility classes directly in JSX.

### Enhanced Features Adopted (Nice to Keep)
- [x] **Power System & Boot Sequence**: Added `usePowerStore`, `PowerButton`, `PowerOffDialog` (confirmation overlay with `[Y]`/`[N]` shortcuts), boot/shutdown states, and linked `TopBar` status directly to `isPowerOn`.
- [x] **Staggered CRT Power On/Off**: Added `crt-power-on`, `crt-power-off-dot`, `mini-crt-power-on`, and `mini-crt-power-off` animations for screen bezels and stat cards.
- [x] **CRT Glitch & Screen Layers**: Added `crt-vignette`, `crt-glass-reflection`, and `glitch-effect` overlay keyframes and styles.
- [x] **ToastKey Remount Fix**: Key-based remount handling in `ToastScreen` to force clean animation re-triggers.
- [x] **Responsive Breakpoints**: Converted chassis and screen grid to responsive Tailwind v4 variants (`grid-cols-1 md:grid-cols-[48px_1fr_180px] lg:grid-cols-[56px_1fr_240px]`).

---

## ⚡ Phase 2: API Integration & Data Cleanup (`api-integration` branch)

- [ ] **Create Branch `api-integration`**: `git checkout -b api-integration` off `styling-and-structure`.
- [ ] **Remove Mock Data**: Remove `MOCK_HISTORY_ROWS` and hardcoded `SAMPLE_IMAGES` from `useDataQueries.js` / mock data files.
- [ ] **Backend History Integration**: Connect history UI and `TerminalText` to `useHistory` TanStack Query hook fetching from `/history`.
- [ ] **Offline / Graceful Waiting State**: Display genuine `"AWAITING BACKEND..."` or 0-record status when backend is unreachable (no mock fallback).
- [ ] **Preserve Local Sample Detection**: Keep local detection sample images available for offline demo detection.
- [ ] **Backend Detection Integration**: Ensure upload mutation connects to `/detect` endpoint with error toast and fallback on failure.

---

## 🛠️ Quick Reference Commands

```bash
# Check status and uncommitted changes
git status -sb

# Commit changes using Conventional Commits
git commit -m "feat: add power store and boot sequence"
git commit -m "refactor: separate domain stores"
git commit -m "fix: resolve toast key remount issue"

# Create Phase 2 branch when ready
git checkout -b api-integration

# Inspect external reference project
cd .. && unzip -l lookout.zip # or inspect extracted lookout files
```
