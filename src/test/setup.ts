import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
  writable: true,
});

vi.mock('motion/react', async () => {
  const createMotionComponent = (tag: string) =>
    React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { layoutId?: string }>(
      ({ children, layoutId: _layoutId, ...props }, ref) =>
      React.createElement(tag, { ...props, ref }, children),
    );

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => createMotionComponent(tag),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    motion,
  };
});
