# Frontend Development Tasks - History & Detection Dashboard

## Completed Tasks
- [x] Pre-trained YOLO model backend integration & API client setup
- [x] Basic bounding box rendering on image upload
- [x] Basic history log viewing in terminal text
- [x] CRT arcade chassis and navigation system

## Current Phase: Tasks 1 - 3 (Branch: `feat/frontend-history-table`)

### Task 1: Error Toast Notifications & Upload Validation
- [ ] Add client-side validation for file type (JPEG, PNG, WebP) in `useFileUpload.js` / `useKeyboardNav.js`
- [ ] Surface clear, human-readable error messages in `ToastScreen.jsx` and `DetectionStore` for unsupported files, network drops, or backend errors
- [ ] Prevent application state crashes on empty or invalid file selection

### Task 2: History Filter UI & State Management
- [ ] Add filter state to history queries (Min Confidence threshold, Date range)
- [ ] Add filter controls and status indicator in History view
- [ ] Support filter navigation/toggling via keyboard and UI controls

### Task 3: Tabular & Structured History View
- [ ] Format History items into a structured data table with headers: `ID`, `TIMESTAMP`, `COUNT`, `AVG CONF`, `INFERENCE TIME`
- [ ] Render average metrics summary bar (Total Detections, Avg Crowd Size, Mean Confidence)
- [ ] Maintain retro CRT styling consistency and keyboard selection reactivity
