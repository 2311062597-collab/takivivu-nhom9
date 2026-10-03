import {
  Bell,
  CalendarCheck2,
  Check,
  CheckCheck,
  CircleDollarSign,
  Clock3,
  Gift,
  Info,
  Plane,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { notificationApi } from '../../api/services'
import type { NotificationItem, NotificationType } from '../../types'
import { apiError, dateTime } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'

type Filter = 'ALL' | 'BOOKING' | 'PAYMENT' | 'PROMOTION' | 'SYSTEM'

const TYPE_TEXT: Record<NotificationType, string> = {
  REGISTER_SUCCESS: 'Hệ thống',
  BOOKING_CREATED: 'Đơn hàng',
  PAYMENT_SUCCESS: 'Thanh toán',
  PAYMENT_FAILED: 'Thanh toán',
  BOOKING_CONFIRMED: 'Đơn hàng',
  BOOKING_CANCELLED: 'Đơn hàng',
  REFUND_SUCCESS: 'Thanh toán',
  PROVIDER_NEW_BOOKING: 'Đơn hàng',
  PROVIDER_BOOKING_CANCELLED: 'Đơn hàng',
}

function filterOf(n: NotificationItem): Filter {
  if (['BOOKING_CREATED','BOOKING_CONFIRMED','BOOKING_CANCELLED'].includes(n.type)) return 'BOOKING'
  if (['PAYMENT_SUCCESS','PAYMENT_FAILED','REFUND_SUCCESS'].includes(n.type)) return 'PAYMENT'
  return 'SYSTEM'
}

function iconOf(type: NotificationType) {
  if (type === 'PAYMENT_SUCCESS' || type === 'REFUND_SUCCESS') return CircleDollarSign
  if (type === 'PAYMENT_FAILED' || type === 'BOOKING_CANCELLED') return XCircle
  if (type === 'BOOKING_CONFIRMED') return CalendarCheck2
  if (type === 'BOOKING_CREATED') return Plane
  return ShieldCheck
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [marking, setMarking] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await notificationApi.mine()
      setData(rows)
      setSelectedId(prev => prev && rows.some(x => x.id === prev) ? prev : rows[0]?.id || null)
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const unread = useMemo(() => data.filter(x => !x.isRead).length, [data])
  const filtered = useMemo(() => filter === 'ALL' ? data : data.filter(n => filterOf(n) === filter), [data, filter])
  const selected = data.find(x => x.id === selectedId) || null

  const count = (f: Filter) => f === 'ALL' ? data.length : data.filter(n => filterOf(n) === f).length

  const choose = async (n: NotificationItem) => {
    setSelectedId(n.id)
    if (!n.isRead) {
      try {
        const updated = await notificationApi.read(n.id)
        setData(d => d.map(x => x.id === updated.id ? updated : x))
        window.dispatchEvent(new Event('takivivu:notifications-updated'))
      } catch { /* detail can still be viewed */ }
    }
  }

  const markAllRead = async () => {
    const pending = data.filter(x => !x.isRead)
    if (!pending.length) return
    setMarking(true)
    try {
      const updates = await Promise.allSettled(pending.map(n => notificationApi.read(n.id)))
      const successful = updates.filter((r): r is PromiseFulfilledResult<NotificationItem> => r.status === 'fulfilled').map(r => r.value)
      setData(rows => rows.map(row => successful.find(x => x.id === row.id) || row))
      window.dispatchEvent(new Event('takivivu:notifications-updated'))
    } finally {
      setMarking(false)
    }
  }

  return <div className="customer-notifications-shell-v5">
    <div className="container customer-notifications-wrap-v5">
      <div className="customer-notifications-breadcrumb-v5">Trang chủ <span>›</span> Thông báo</div>
      <div className="customer-notifications-title-v5">
        <div><h1>Thông báo</h1><p>Cập nhật những thông tin mới nhất về đơn hàng, thanh toán và hoạt động tài khoản của bạn.</p></div>
        <button onClick={() => void markAllRead()} disabled={marking || unread === 0}><CheckCheck/>{marking ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}</button>
      </div>

      <div className="customer-notifications-tabs-v5">
        {([['ALL','Tất cả'],['BOOKING','Đơn hàng'],['PAYMENT','Thanh toán'],['PROMOTION','Khuyến mãi'],['SYSTEM','Hệ thống']] as Array<[Filter,string]>).map(([key,label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label} <b>{count(key)}</b></button>)}
      </div>

      {loading ? <Loading/> : error ? <ErrorState message={error} onRetry={load}/> : <div className="customer-notification-layout-v5">
        <section className="customer-notification-list-v5">
          {filtered.length === 0 ? <div className="customer-notification-empty-v5"><Bell/><b>Không có thông báo trong mục này</b><span>Dữ liệu được lấy từ Notification Service.</span></div> : filtered.map(n => {
            const Icon = iconOf(n.type)
            return <button key={n.id} className={`${selectedId === n.id ? 'selected' : ''} ${!n.isRead ? 'unread' : ''}`} onClick={() => void choose(n)}>
              <i className={`notice-type-${filterOf(n).toLowerCase()}`}><Icon/></i>
              <span><strong>{n.title}</strong><em>{n.message}</em></span>
              <small>{dateTime(n.createdAt)}</small>
              {!n.isRead && <b className="unread-dot-v5"/>}
            </button>
          })}
        </section>

        <aside className="customer-notification-detail-v5">
          {selected ? <>
            <div className="notification-detail-top-v5"><button onClick={() => setSelectedId(null)}>← Quay lại danh sách</button><span>{selected.isRead ? <><Check/> Đã đọc</> : <><Clock3/> Chưa đọc</>}</span></div>
            <div className={`notification-detail-icon-v5 notice-type-${filterOf(selected).toLowerCase()}`}>{(() => { const Icon = iconOf(selected.type); return <Icon/> })()}</div>
            <h2>{selected.title}</h2>
            <time>{dateTime(selected.createdAt)}</time>
            <p>{selected.message}</p>
            <div className="notification-detail-info-v5"><div><Info/><span><small>Nhóm thông báo</small><b>{TYPE_TEXT[selected.type]}</b></span></div><div><Bell/><span><small>Mã sự kiện</small><b>#{selected.id}</b></span></div></div>
            <div className="notification-backend-note-v5"><ShieldCheck/><span><b>Thông báo của bạn</b><small>Thông báo được cập nhật trực tiếp từ hệ thống.</small></span></div>
          </> : <div className="customer-notification-empty-v5"><Bell/><b>Chọn một thông báo</b><span>Nội dung chi tiết sẽ hiển thị tại đây.</span></div>}
        </aside>
      </div>}

      {!loading && !error && <div className="notification-footer-meta-v5"><span><Bell/> {unread} thông báo chưa đọc</span><button onClick={() => void load()}><RefreshCw/>Làm mới</button><span><RotateCcw/> Đã đồng bộ</span></div>}
    </div>
  </div>
}
