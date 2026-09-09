# DETECTO REFACTORED - IMPLEMENTATION CHECKLIST

## Phase 1: Styling & Structure (`styling-and-structure` branch)

### Architectural Integrity (Keep Clean Patterns)
- [x] **Modular Zustand Stores**: Kept clean, domain-separated stores (`NavigationStore.js`, `DetectionStore.js`, `PowerStore.js`) instead of one monolithic store.
- [x] **Modular Screen Components**: Preserved decomposed UI components (`ConsoleShell`, `ScreenBezel`, `TerminalText`, `ResultView`, `SceneCanvas`, `BoundingBox`, etc.) over a monolithic single-component structure.
- [x] **No Static `useQuery` Wrappers**: Direct static handling for local demo assets without useless `useQuery` overhead.
- [x] **Bundled Local Samples**: Preserved locally bundled demo images in `frontend/public/samples/` for offline availability.
- [x] **Reusable Components**: Maintained reusable `StatScreen` component for stats rail.
- [x] **Shared Clock Hook**: Preserved shared `useClock` hook in `DirectionsPanel`.
- [x] **Keyboard Navigation**: Maintained Up/Down and Left/Right arrow key navigation, Enter, Space, Escape, Backspace.
- [x] **5-Pass Toast Animation**: Kept explicit 5-iteration marquee scroll requirement (`animation: toastMarquee 3.2s linear 5`).
- [x] **No Dead Stub Files**: Omitted unnecessary stub components like `ScreenHeader.jsx` or `ScreenFooter.jsx`.

### Unconditional Removals
- [x] **Audio Removed**: Zero Web Audio API calls, sound effects, or `audio.js` services.
- [x] **Tailwind v3 Discarded**: Pure Tailwind v4 setup via `@import "tailwindcss";` without legacy `tailwind.config.js`, `postcss.config.js`, or `@tailwind` directives.
- [x] **No Duplicated Structural CSS**: Grid layouts and positioning use Tailwind v4 utility classes in JSX instead of custom CSS grid classes.

### Enhanced Features Adopted from Lookout
- [x] **Power System & Boot Sequence**: Added `usePowerStore`, `PowerButton`, `PowerOffDialog` (confirmation overlay with [Y]/[N] shortcuts), and boot/shutdown states.
- [x] **TopBar Status Integration**: Connected `TopBar` online status directly to `isPowerOn` state.
- [x] **Staggered CRT Power On/Off**: Added `crt-power-on`, `crt-power-off-dot`, `mini-crt-power-on`, and `mini-crt-power-off` animations for screen bezels and stat cards.
- [x] **CRT Glitch & Screen Layers**: Added `crt-vignette`, `crt-glass-reflection`, and `glitch-effect` overlay keyframes and styles.
- [x] **ToastKey Remount Fix**: Added key-based remount handling to `ToastScreen` to force clean animation re-triggers.
- [x] **Responsive Breakpoints**: Converted chassis and screen grid to responsive Tailwind v4 variants (`grid-cols-1 md:grid-cols-[48px_1fr_180px] lg:grid-cols-[56px_1fr_240px]`).

---

## Phase 2: API Integration & Data Cleanup (`api-integration` branch)

- [ ] **Create Branch `api-integration`**: Branch off `styling-and-structure`.
- [ ] **Remove Mock History Data**: Remove `MOCK_HISTORY_ROWS` from mock data and components.
- [ ] **Backend History Integration**: Connect history UI and `TerminalText` to `useHistory` TanStack Query hook fetching from `/history`.
- [ ] **Offline / Waiting State**: Handle offline backend state gracefully with genuine "AWAITING BACKEND..." or 0-record status when backend is unreachable.
- [ ] **Preserve Local Sample Detection**: Keep local detection sample images available for offline demo detection.
- [ ] **Backend Detection Integration**: Ensure upload mutation connects to `/detect` endpoint with error toast and fallback on failure.
