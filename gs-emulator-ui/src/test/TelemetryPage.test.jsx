import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TelemetryPage from '../TelemetryPage'

vi.mock('axios')
import axios from 'axios'

const now = Date.now()

const SATS = [{ satellite_id: 'sat-1', name: 'Alpha' }]
const GS   = [{ ground_station_id: 'gs-1', name: 'North' }]

const TELEMETRY_200 = {
    satellite_id:        'sat-1',
    satellite_name:      'Alpha',
    ground_station_id:   'gs-1',
    ground_station_name: 'North',
    pass_id:             'p-1',
    pass_start: new Date(now - 5 * 60_000).toISOString(),
    pass_end:   new Date(now + 5 * 60_000).toISOString(),
    telemetry:  { altitude_km: 550, signal_strength: -72 },
}

function renderPage(search = '') {
    return render(
        <MemoryRouter initialEntries={[`/telemetry${search}`]}>
            <Routes>
                <Route path="/telemetry" element={<TelemetryPage />} />
            </Routes>
        </MemoryRouter>
    )
}

function mockBase() {
    axios.get.mockImplementation((url) => {
        if (url === '/satellites')    return Promise.resolve({ data: SATS })
        if (url === '/groundstations') return Promise.resolve({ data: GS })
        return Promise.reject(new Error(`Unexpected GET ${url}`))
    })
}

beforeEach(() => {
    vi.clearAllMocks()
    mockBase()
})

describe('TelemetryPage', () => {
    it('shows empty prompt when no params are provided', async () => {
        renderPage()
        await waitFor(() => expect(screen.getByText(/select a satellite/i)).toBeInTheDocument())
    })

    it('shows 200 success panel when spacecraft is in contact', async () => {
        axios.get.mockImplementation((url) => {
            if (url === '/satellites')    return Promise.resolve({ data: SATS })
            if (url === '/groundstations') return Promise.resolve({ data: GS })
            if (url.startsWith('/telemetry/'))
                return Promise.resolve({ status: 200, data: TELEMETRY_200 })
            return Promise.reject(new Error(`Unexpected GET ${url}`))
        })
        renderPage('?sat=sat-1&gs=gs-1')
        await waitFor(() => expect(screen.getByText(/in contact/i)).toBeInTheDocument())
        expect(screen.getByText(/http 200/i)).toBeInTheDocument()
        expect(screen.getByText(/live/i)).toBeInTheDocument()
    })

    it('shows 503 panel with next-pass info when spacecraft is out of contact', async () => {
        const nextStart = new Date(now + 60 * 60_000).toISOString()
        const nextEnd   = new Date(now + 70 * 60_000).toISOString()
        const body503 = {
            error: "Spacecraft 'sat-1' is not in contact",
            next_pass_id:    'p-future',
            next_pass_start: nextStart,
            next_pass_end:   nextEnd,
        }
        axios.get.mockImplementation((url) => {
            if (url === '/satellites')    return Promise.resolve({ data: SATS })
            if (url === '/groundstations') return Promise.resolve({ data: GS })
            if (url.startsWith('/telemetry/')) {
                const err = Object.assign(new Error('503'), {
                    response: { status: 503, data: body503 },
                })
                return Promise.reject(err)
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`))
        })
        renderPage('?sat=sat-1&gs=gs-1')
        await waitFor(() => expect(screen.getByText(/out of contact/i)).toBeInTheDocument())
        expect(screen.getByText(/http 503/i)).toBeInTheDocument()
        expect(screen.getByText(/next scheduled pass/i)).toBeInTheDocument()
    })

    it('shows 503 panel without next-pass info when no future pass exists', async () => {
        const body503 = { error: "Spacecraft 'sat-1' is not in contact" }
        axios.get.mockImplementation((url) => {
            if (url === '/satellites')    return Promise.resolve({ data: SATS })
            if (url === '/groundstations') return Promise.resolve({ data: GS })
            if (url.startsWith('/telemetry/')) {
                const err = Object.assign(new Error('503'), {
                    response: { status: 503, data: body503 },
                })
                return Promise.reject(err)
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`))
        })
        renderPage('?sat=sat-1&gs=gs-1')
        await waitFor(() => expect(screen.getByText(/out of contact/i)).toBeInTheDocument())
        expect(screen.getByText(/no future passes/i)).toBeInTheDocument()
    })

    it('shows 404 panel when satellite or ground station is not found', async () => {
        const body404 = { error: "Satellite 'sat-99' not found" }
        axios.get.mockImplementation((url) => {
            if (url === '/satellites')    return Promise.resolve({ data: SATS })
            if (url === '/groundstations') return Promise.resolve({ data: GS })
            if (url.startsWith('/telemetry/')) {
                const err = Object.assign(new Error('404'), {
                    response: { status: 404, data: body404 },
                })
                return Promise.reject(err)
            }
            return Promise.reject(new Error(`Unexpected GET ${url}`))
        })
        renderPage('?sat=sat-99&gs=gs-1')
        await waitFor(() => expect(screen.getByText(/http 404/i)).toBeInTheDocument())
        expect(screen.getByText(/sat-99/)).toBeInTheDocument()
    })
})
