import '@testing-library/jest-dom/vitest';

// jsdom does not implement scrollIntoView, but the terminal calls it to keep
// the selected history row visible. Stub it so components render in tests.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
