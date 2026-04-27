import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AssignmentOverviewPage from '../AssignmentOverviewPage'

vi.mock('axios')
import axios from 'axios'

const SATS = [
    { satellite_id: 'sat-1', name: 'Alpha' },
    { satellite_id: 'sat-2', name: 'Beta' },
]
const GS = [
    { ground_station_id: 'gs-1', name: 'North' },
    { ground_station_id: 'gs-2', name: 'South' },
]
const ASSIGNMENTS = [
    { satellite_id: 'sat-1', ground_station_id: 'gs-1' },
    { satellite_id: 'sat-1', ground_station_id: 'gs-2' },
]

function mockApis(overrides = {}) {
    const defaults = {
        '/satellites':    { data: SATS },
        '/groundstations': { data: GS },
        '/assignments':    { data: ASSIGNMENTS },
    }
    const resolved = { ...defaults, ...overrides }
    axios.get.mockImplementation((url) => {
        if (url in resolved) return Promise.resolve(resolved[url])
        return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
}

function renderPage() {
    return render(<MemoryRouter><AssignmentOverviewPage /></MemoryRouter>)
}

beforeEach(() => {
    vi.clearAllMocks()
    mockApis()
})

describe('AssignmentOverviewPage', () => {
    it('renders summary stat cards after data loads', async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText('Satellites')).toBeInTheDocument())
        expect(screen.getByText('Ground Stations')).toBeInTheDocument()
        expect(screen.getByText('Assignments')).toBeInTheDocument()
    })

    it('shows correct counts in stat cards', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Satellites'))
        // 2 satellites, 2 ground stations, 2 assignments → all counts are "2"
        const twos = screen.getAllByText('2')
        expect(twos.length).toBeGreaterThanOrEqual(3)
    })

    it('renders a card for each satellite', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        expect(screen.getByText('Beta')).toBeInTheDocument()
    })

    it('lists assigned ground stations under the correct satellite', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        // sat-1 is assigned to gs-1 and gs-2
        expect(screen.getByText('gs-1')).toBeInTheDocument()
        expect(screen.getByText('gs-2')).toBeInTheDocument()
    })

    it('shows "No ground stations assigned" for unassigned satellite', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Beta'))
        expect(screen.getByText(/no ground stations assigned/i)).toBeInTheDocument()
    })

    it('shows error alert when the API fails', async () => {
        axios.get.mockRejectedValue(new Error('Network error'))
        renderPage()
        await waitFor(() =>
            expect(screen.getByText(/failed to load overview data/i)).toBeInTheDocument()
        )
    })

    it('shows empty state when there are no satellites', async () => {
        mockApis({ '/satellites': { data: [] }, '/assignments': { data: [] } })
        renderPage()
        await waitFor(() =>
            expect(screen.getByText(/no satellites found/i)).toBeInTheDocument()
        )
    })

    it('Refresh button re-fetches data', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: /refresh/i }))
        // axios.get should have been called a second time for each endpoint
        expect(axios.get).toHaveBeenCalledTimes(6) // 3 on mount + 3 on refresh
    })
})
