const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchHealth() {
    const res = await fetch(`${BASE_URL}/health`)
    return res.json()
}

export async function fetchCountries() {
    const res = await fetch(`${BASE_URL}/countries`)
    return res.json()
}

export async function fetchEvents() {
    const res = await fetch(`${BASE_URL}/events`)
    return res.json()
}