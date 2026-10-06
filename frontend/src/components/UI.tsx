import type { ReactNode } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return <div className="state"><LoaderCircle className="spin" /><span>{label}</span></div>
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state error-state"><AlertCircle /><div><strong>Không thể tải dữ liệu</strong><p>{message}</p>{onRetry && <button className="btn btn-outline" onClick={onRetry}>Thử lại</button>}</div></div>
}
export function EmptyState({ title = 'Chưa có dữ liệu', description }: { title?: string; description?: string }) {
  return <div className="empty"><div className="empty-icon">✦</div><strong>{title}</strong>{description && <p>{description}</p>}</div>
}
export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-title"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}
export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'green' | 'red' | 'amber' | 'gray' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>×</button></div>{children}</div></div>
}
