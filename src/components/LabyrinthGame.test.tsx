import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LabyrinthGame from './LabyrinthGame';

const press = (key: string) => {
  fireEvent.keyDown(window, { key });
};

const getAmbientRegister = () =>
  screen.getByText((_content, element) => element?.textContent === 'User: User_Session_Id_8923 | Tenant: ⚠️ NULL');

const getEmptyAmbientRegister = () =>
  screen.getByText((_content, element) => element?.textContent === 'User: ⚠️ NULL | Tenant: ⚠️ NULL');

describe('LabyrinthGame', () => {
  it('resets mutated singleton state when the phase changes', async () => {
    const onActionComplete = vi.fn();
    const { rerender } = render(<LabyrinthGame phase="folklore_chaos" onActionComplete={onActionComplete} />);

    press('ArrowRight');
    press('ArrowRight');
    press('ArrowRight');
    press('Enter');

    expect(getAmbientRegister()).toBeTruthy();

    rerender(<LabyrinthGame phase="map_lying" onActionComplete={onActionComplete} />);

    await waitFor(() => {
      expect(getEmptyAmbientRegister()).toBeTruthy();
    });
  });

  it('clears the testing reset hook when leaving and re-entering the testing phase', async () => {
    const user = userEvent.setup();
    const onActionComplete = vi.fn();
    const { rerender } = render(<LabyrinthGame phase="testing_fever" onActionComplete={onActionComplete} />);

    const resetToggle = screen.getByRole('checkbox');
    await user.click(resetToggle);
    expect((resetToggle as HTMLInputElement).checked).toBe(true);

    rerender(<LabyrinthGame phase="classic_corridor" onActionComplete={onActionComplete} />);
    rerender(<LabyrinthGame phase="testing_fever" onActionComplete={onActionComplete} />);

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('keeps the initial console autoscroll inside the log panel', async () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});

    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 120
    });

    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 40
    });

    try {
      render(<LabyrinthGame phase="classic_corridor" onActionComplete={vi.fn()} />);

      const consoleOutput = screen.getByLabelText('Stack Trace Console Output');

      await waitFor(() => {
        expect(consoleOutput.scrollTop).toBe(80);
      });

      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
      }

      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
      }
    }
  });
});
