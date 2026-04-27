import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PassSchedulingPage from '../PassSchedulingPage'

vi.mock('axios')
import axios from 'axios'

const now = Date.now()

const PASSES = [
    {
        pass_id: 'p-1',
        satellite_id: 'sat-1',
        ground_station_id: 'gs-1',
        start_time: new Date(now - 5 * 60_000).toISOString(),
        end_time:   new Date(now + 5 * 60_000).toISOString(),
        status: 'IN_PROGRESS',
    },
    {
        pass_id: 'p-2',
        satellite_id: 'sat-2',
        ground_station_id: 'gs-2',
        start_time: new Date(now + 60 * 60_000).toISOString(),
        end_time:   new Date(now + 70 * 60_000).toISOString(),
        status: 'SCHEDULED',
    },
    {
        pass_id: 'p-3',
        satellite_id: 'sat-1',
        ground_station_id: 'gs-1',
        start_time: new Date(now - 120 * 60_000).toISOString(),
        end_time:   new Date(now - 60 * 60_000).toISOString(),
        status: 'COMPLETED',
    },
]

const SATS = [
    { satellite_id: 'sat-1', name: 'Alpha' },
    { satellite_id: 'sat-2', name: 'Beta' },
]
const GS = [
    { ground_station_id: 'gs-1', name: 'North' },
    { ground_station_id: 'gs-2', name: 'South' },
]

function mockApis() {
    axios.get.mockImplementation((url) => {
        if (url === '/satellites')    return Promise.resolve({ data: SATS })
        if (url === '/groundstations') return Promise.resolve({ data: GS })
        if (url === '/passes')         return Promise.resolve({ data: PASSES })
        return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
}

function renderPage() {
    return render(<MemoryRouter><PassSchedulingPage /></MemoryRouter>)
}

beforeEach(() => {
    vi.clearAllMocks()
    mockApis()
})

describe('PassSchedulingPage', () => {
    it('renders status badges for all loaded passes', async () => {
        renderPage()
        // Use getAllBy because the legend and stat card also render these labels
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        expect(screen.getAllByText('Scheduled').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1)
    })

    it('shows Telemetry button only for IN_PROGRESS passes', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        const telemetryBtns = screen.getAllByRole('button', { name: /telemetry/i })
        expect(telemetryBtns).toHaveLength(1)
    })

    it('shows Cancel button for SCHEDULED and IN_PROGRESS passes only', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        const cancelBtns = screen.getAllByRole('button', { name: /^cancel$/i })
        // p-1 (IN_PROGRESS) and p-2 (SCHEDULED) are cancellable; p-3 (COMPLETED) is not
        expect(cancelBtns).toHaveLength(2)
    })

    it('hides action buttons for non-matching rows after filtering to COMPLETED', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: 'COMPLETED' }))
        // Only COMPLETED pass visible in table; no cancel or telemetry buttons for it
        expect(screen.queryAllByRole('button', { name: /^cancel$/i })).toHaveLength(0)
        expect(screen.queryAllByRole('button', { name: /telemetry/i })).toHaveLength(0)
    })

    it('restores all pass rows when All filter is selected', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: 'COMPLETED' }))
        await user.click(screen.getByRole('button', { name: 'All' }))
        // Cancel buttons should be back for SCHEDULED + IN_PROGRESS
        expect(screen.getAllByRole('button', { name: /^cancel$/i })).toHaveLength(2)
    })

    it('shows validation alert when submitting with no satellite selected', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        // Use fireEvent.submit to bypass jsdom's native HTML5 required-field validation
        const form = screen.getByText(/schedule a new pass/i).closest('.card').querySelector('form')
        fireEvent.submit(form)
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent(/select both/i)
        )
    })

    it('shows summary stat cards when passes are loaded', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        // Stat cards are present — one for each status
        expect(screen.getAllByText('Scheduled').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1)
    })

    it('shows empty state message when no passes match the selected filter', async () => {
        renderPage()
        await waitFor(() => expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1))
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: 'CANCELLED' }))
        expect(screen.getByText(/no passes match/i)).toBeInTheDocument()
    })
})
