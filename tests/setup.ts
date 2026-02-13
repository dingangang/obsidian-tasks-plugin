// Vitest setup file
// Global test configuration and mocks

export {};

// Mock Obsidian API globally
(globalThis as any).obsidian = {
  requestUrl: () => Promise.resolve(''),
  loadCss: () => {},
  getStyles: () => [],
  getDefaultImgSizes: () => [],
};
