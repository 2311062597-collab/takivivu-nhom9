import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { notificationApi } from '../api/services'
import { readSession } from '../api/client'
import type { NotificationItem } from '../types'
import './globalToast.css'

export type ToastKind = 'success' | 'info' | 'warning' | 'error'
type ToastData = { id: string; title: string; message: string; kind: ToastKind }
type ToastEvent = Omit<ToastData, 'id'>
const EVENT = 'takivivu:toast'
export function showToast(data: ToastEvent) {
  window.dispatchEvent(new CustomEvent<ToastEvent>(EVENT, { detail: data }))
}
function notificationKind(item: NotificationItem): ToastKind {
  const type = String(item.type).toUpperCase()
  if (/FAILED|REJECT|CANCELLED|ERROR/.test(type)) return 'error'
  if (/REQUEST|EXPIRE|WARNING|PENDING/.test(type)) return 'warning'
  if (/SUCCESS|CONFIRMED|REFUND/.test(type)) return 'success'
  return 'info'
}
const icons = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertCircle }

/** Mount once above all routes; displays new server notifications without replaying history. */
export default function GlobalToast() {
  const [items, setItems] = useState<ToastData[]>([])
  useEffect(() => {
    const timeouts = new Map<string, number>()
    const add = (data: ToastEvent) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setItems(previous => [...previous, { ...data, id }])
      timeouts.set(id, window.setTimeout(() => {
        setItems(previous => previous.filter(item => item.id !== id))
        timeouts.delete(id)
      }, 5000))
    }
    const onToast = (event: Event) => add((event as CustomEvent<ToastEvent>).detail)
    const onClose = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      window.clearTimeout(timeouts.get(id))
      timeouts.delete(id)
      setItems(previous => previous.filter(item => item.id !== id))
    }
    window.addEventListener(EVENT, onToast)
    window.addEventListener('takivivu:toast-close', onClose)
    return () => {
      window.removeEventListener(EVENT, onToast)
      window.removeEventListener('takivivu:toast-close', onClose)
      timeouts.forEach(timeout => window.clearTimeout(timeout))
    }
  }, [])
  useEffect(() => {
    let disposed = false
    let activeUser: number | null = null
    let seen = new Set<number>()
    let initialized = false
    const check = async () => {
      const session = readSession()
      const id = session?.id ?? null
      if (id !== activeUser) { activeUser = id; seen = new Set(); initialized = false }
      if (!id) return
      try {
        const notifications = await notificationApi.mine()
        if (disposed || activeUser !== id) return
        if (initialized) notifications.filter(n => !seen.has(n.id) && !n.isRead).forEach(n => showToast({ title: n.title, message: n.message, kind: notificationKind(n) }))
        notifications.forEach(n => seen.add(n.id))
        initialized = true
      } catch { /* Keep notifications page as source of truth when offline. */ }
    }
    void check()
    const interval = window.setInterval(check, 10000)
    const onUpdated = () => void check()
    window.addEventListener('takivivu:notifications-updated', onUpdated)
    return () => { disposed = true; window.clearInterval(interval); window.removeEventListener('takivivu:notifications-updated', onUpdated) }
  }, [])
  return <div className="takivivu-toast-stack" aria-live="polite" aria-relevant="additions">
    {items.map(item => {
      const Icon = icons[item.kind]
      return <section className={`takivivu-toast takivivu-toast--${item.kind}`} key={item.id} role={item.kind === 'error' ? 'alert' : 'status'}>
        <Icon className="takivivu-toast-icon" aria-hidden="true" />
        <div className="takivivu-toast-content"><strong>{item.title}</strong><p>{item.message}</p></div>
        <button type="button" aria-label="Đóng thông báo" onClick={() => window.dispatchEvent(new CustomEvent('takivivu:toast-close', { detail: item.id }))}><X size={17}/></button>
      </section>
    })}
  </div>
}
