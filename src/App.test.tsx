import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('lets desktop users finish the walkthrough from the last chapter', async () => {
    const user = userEvent.setup();

    render(<App />);

    for (let index = 0; index < 5; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Next Chapter' }));
    }

    const desktopNextButton = screen.getByRole('button', { name: 'Next Chapter' });
    expect((desktopNextButton as HTMLButtonElement).disabled).toBe(false);

    await user.click(desktopNextButton);

    expect(screen.getByText('The Labyrinth is Deconstructed')).toBeTruthy();
  });
});
