import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SatellitePage from '../SatellitePage'

vi.mock('axios')
import axios from 'axios'

const SATS = [
    { satellite_id: 'sat-1', name: 'Alpha', telemetry_payload: {} },
    { satellite_id: 'sat-2', name: 'Beta',  telemetry_payload: { altitude: 550 } },
]

function renderPage() {
    return render(<MemoryRouter><SatellitePage /></MemoryRouter>)
}

beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: SATS })
    axios.get.mockResolvedValue({ data: SATS })
})

describe('SatellitePage', () => {
    it('renders satellite list after loading', async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument())
        expect(screen.getByText('Beta')).toBeInTheDocument()
    })

    it('shows empty state when no satellites exist', async () => {
        axios.get.mockResolvedValueOnce({ data: [] })
        renderPage()
        await waitFor(() =>
            expect(screen.getByText(/no satellites yet/i)).toBeInTheDocument()
        )
    })

    it('shows error alert when API call fails', async () => {
        axios.get.mockRejectedValueOnce(new Error('Network error'))
        renderPage()
        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i)
    })

    it('shows validation alert when creating with empty fields', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: /^create$/i }))
        await waitFor(() =>
            expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
        )
    })

    it('submits create request with correct payload', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        const user = userEvent.setup()
        await user.type(screen.getByPlaceholderText(/e\.g\. sat-alpha/i), 'sat-new')
        await user.type(screen.getByPlaceholderText(/e\.g\. Alpha Sat/i), 'New Sat')
        await user.click(screen.getByRole('button', { name: /^create$/i }))
        await waitFor(() =>
            expect(axios.post).toHaveBeenCalledWith('/satellites', {
                satellite_id: 'sat-new',
                name: 'New Sat',
            })
        )
    })

    it('displays satellite IDs in code elements', async () => {
        renderPage()
        await waitFor(() => screen.getByText('Alpha'))
        expect(screen.getByText('sat-1')).toBeInTheDocument()
        expect(screen.getByText('sat-2')).toBeInTheDocument()
    })
})
