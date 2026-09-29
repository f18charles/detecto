# Frontend Development Tasks - History & Detection Dashboard

## Completed Tasks
- [x] Pre-trained YOLO model backend integration & API client setup
- [x] Bounding box rendering on image upload
- [x] CRT arcade chassis and keyboard navigation system

## Phase 1: Tasks 1 - 3 (Branch: `feat/frontend-history-table`)
- [x] **Task 1: Error Toast Notifications & File Validation**
  - [x] Add client-side validation for file type (JPEG, PNG, WebP) in `useFileUpload.js` / `useKeyboardNav.js`
  - [x] Surface clear, human-readable error messages in `ToastScreen.jsx` and `DetectionStore`
  - [x] Prevent application state crashes on invalid file selection or API error

- [x] **Task 2: History Filter UI & State Management**
  - [x] Multi-criteria filter store for Min Confidence, Date Range, and Time of Day in `HistoryFilterStore.js`
  - [x] On-the-fly client-side filter evaluation and `localStorage` fallback caching in `UseHistory.js`
  - [x] Keyboard shortcuts (`C`, `D`, `T`, `X`) for seamless filter toggling

- [x] **Task 3: Tabular & Structured History View**
  - [x] Format History items into a structured CRT data table with headers: `ID`, `TIMESTAMP`, `PEOPLE`, `AVG CONF`, `INFERENCE TIME`
  - [x] Summary metrics bar (Filtered Records, Total People, Mean Confidence)
  - [x] CRT styling consistency and keyboard selection reactivity

## Phase 2: Tasks 4 - 5 (Branch: `feat/frontend-stream-and-docs`)
- [x] **Task 4: Live Video Stream & Webcam Feed Capture**
  - [x] Implement HTML5 webcam video stream hook (`useWebcamStream.js`)
  - [x] Real-time frame capture & POST request stream inference loop
  - [x] Live bounding box and stats overlay rendering in `ResultView.jsx`

- [x] **Task 5: Documentation & Validation Metrics**
  - [x] Comprehensive setup and run instructions in `README.md`
  - [x] Validation metrics table and ASCII UI previews
  - [x] Keyboard shortcuts and architecture documentation
