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
});
