import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../api/client';

const mockMatches = [
  {
    id: 1,
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    matchDate: '2026-06-01T15:00:00.000Z',
    homeScore: 2,
    awayScore: 1,
    status: 'FINISHED',
    competition: 'WORLD_CUP',
    groupName: 'Group A',
  },
  {
    id: 2,
    homeTeam: 'Celtic',
    awayTeam: 'Rangers',
    matchDate: '2026-09-10T15:00:00.000Z',
    homeScore: null,
    awayScore: null,
    status: 'SCHEDULED',
    competition: 'SCOTTISH_PREM',
    groupName: null,
  },
];

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: { matches: mockMatches } });
  });

  it('renders the page title', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('比赛列表')).toBeInTheDocument();
  });

  it('renders match cards after loading', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
      expect(screen.getByText('Celtic')).toBeInTheDocument();
      expect(screen.getByText('Rangers')).toBeInTheDocument();
    });
  });
});
