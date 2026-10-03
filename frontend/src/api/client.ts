import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse } from '../types'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
export const api = axios.create({ baseURL, timeout: 20000 })

// Temporary: log API error responses for debugging
api.interceptors.response.use(
  r => r,
  (error) => {
    try {
      console.error('API error (logged):', {
        url: error?.config?.url,
        method: error?.config?.method,
        status: error?.response?.status,
        data: error?.response?.data,
      })
    } catch (e) { console.error('Failed to log API error', e) }
    return Promise.reject(error)
  }
)

const SESSION_KEY = 'takivivu_session'
export const readSession = (): LoginResponse | null => {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as LoginResponse : null } catch { return null }
}
export const writeSession = (session: LoginResponse | null) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY)
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = readSession()
  if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`
  return config
})

let refreshPromise: Promise<string | null> | null = null
api.interceptors.response.use(r => r, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retry || original.url?.includes('/auth/refresh')) return Promise.reject(error)
  const session = readSession()
  if (!session?.refreshToken) return Promise.reject(error)
  original._retry = true
  refreshPromise ??= axios.post<LoginResponse>(`${baseURL}/auth/refresh`, { refreshToken: session.refreshToken })
    .then(r => { writeSession(r.data); return r.data.accessToken })
    .catch(() => { writeSession(null); return null })
    .finally(() => { refreshPromise = null })
  const token = await refreshPromise
  if (!token) { window.location.href = '/login'; return Promise.reject(error) }
  original.headers.Authorization = `Bearer ${token}`
  return api(original)
})
