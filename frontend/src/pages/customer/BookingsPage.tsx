import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Filter, MapPin, Plane, Search, Ticket, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingApi } from '../../api/services'
import type { Booking, BookingItem, ServiceType } from '../../types'
import { apiError, dateOnly, dateTime, money } from '../../utils/format'
import { bookingStatusLabel, bookingStatusTone, resolveBookingItem, serviceTypeLabel, type BookingPresentation } from '../../utils/bookingPresentation'

const PAGE_SIZE = 6

function ServiceIcon({ type }: { type: ServiceType }) {
  if (type === 'FLIGHT') return <Plane />
  if (type === 'HOTEL') return <BedDouble />
  return <Ticket />
}

function firstItem(booking: Booking): BookingItem | undefined { return booking.danhSachDichVu?.[0] }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [presentation, setPresentation] = useState<Record<number, BookingPresentation>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState<'ALL' | ServiceType>('ALL')
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const data = await bookingApi.mine()
      setBookings(data)
      const entries = await Promise.all(data.map(async booking => {
        const item = firstItem(booking)
        if (!item) return null
        try { return [booking.id, await resolveBookingItem(item)] as const } catch { return null }
      }))
      const map: Record<number, BookingPresentation> = {}
      entries.forEach(entry => { if (entry) map[entry[0]] = entry[1] })
      setPresentation(map)
    } catch (e) { setError(apiError(e)) } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { setPage(1) }, [query, status, type])

  const counts = useMemo(() => {
    const result = { ALL: bookings.length, FLIGHT: 0, HOTEL: 0, ATTRACTION: 0 }
    bookings.forEach(booking => { const item = firstItem(booking); if (item) result[item.loaiDichVu] += 1 })
    return result
  }, [bookings])

  const filtered = useMemo(() => bookings.filter(booking => {
    const item = firstItem(booking)
    const info = presentation[booking.id]
    if (type !== 'ALL' && item?.loaiDichVu !== type) return false
    if (status !== 'ALL' && booking.trangThai !== status) return false
    const haystack = `${booking.maBooking} ${info?.title || ''} ${info?.subtitle || ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [bookings, presentation, query, status, type])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return <div className="customer-bookings-v3">
    <div className="container customer-bookings-wrap-v3">
      <div className="customer-bookings-breadcrumb-v3">Trang chủ <span>›</span> Đơn đặt dịch vụ</div>
      <div className="customer-bookings-title-v3">
        <div><h1>Đơn đặt dịch vụ</h1><p>Quản lý tất cả các đơn đặt chuyến bay, khách sạn và vé tham quan của bạn.</p></div>
        <div className="customer-bookings-tools-v3">
          <label><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo mã đơn, tên dịch vụ..."/></label>
          <label className="status-filter-v3"><Filter/><select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">Lọc theo trạng thái</option><option value="PENDING_PAYMENT">Chờ thanh toán</option><option value="PAID">Đã thanh toán</option><option value="CONFIRMED">Đã xác nhận</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option><option value="REFUND_PENDING">Đang hoàn tiền</option><option value="REFUNDED">Đã hoàn tiền</option></select></label>
        </div>
      </div>

      <div className="customer-bookings-tabs-v3">
        <button className={type === 'ALL' ? 'active' : ''} onClick={() => setType('ALL')}>Tất cả <b>{counts.ALL}</b></button>
        <button className={type === 'FLIGHT' ? 'active' : ''} onClick={() => setType('FLIGHT')}><Plane/>Chuyến bay <b>{counts.FLIGHT}</b></button>
        <button className={type === 'HOTEL' ? 'active' : ''} onClick={() => setType('HOTEL')}><BedDouble/>Khách sạn <b>{counts.HOTEL}</b></button>
        <button className={type === 'ATTRACTION' ? 'active' : ''} onClick={() => setType('ATTRACTION')}><Ticket/>Địa điểm tham quan <b>{counts.ATTRACTION}</b></button>
      </div>

      {loading ? <div className="customer-bookings-state-v3">Đang tải đơn đặt dịch vụ...</div> : error ? <div className="customer-bookings-state-v3 error"><strong>Không thể tải dữ liệu</strong><p>{error}</p><button onClick={() => void load()}>Thử lại</button></div> : shown.length === 0 ? <div className="customer-bookings-state-v3"><strong>Chưa có đơn phù hợp</strong><p>Thay đổi bộ lọc hoặc bắt đầu đặt một dịch vụ mới.</p></div> : <>
        <div className="customer-booking-list-v3">{shown.map(booking => {
          const item = firstItem(booking)
          if (!item) return null
          const info = presentation[booking.id]
          return <article key={booking.id} className="customer-booking-card-v3">
            <div className={`customer-booking-thumb-v3 type-${item.loaiDichVu.toLowerCase()}`}>{info?.image ? <img src={info.image} alt=""/> : <ServiceIcon type={item.loaiDichVu}/>}<span>{serviceTypeLabel(item.loaiDichVu)}</span></div>
            <div className="customer-booking-main-v3">
              <div className="customer-booking-name-v3"><span className={`service-chip-v3 ${item.loaiDichVu.toLowerCase()}`}>{serviceTypeLabel(item.loaiDichVu)}</span><h3>{info?.title || `${serviceTypeLabel(item.loaiDichVu)} #${item.dichVuId}`}</h3><p>{info?.subtitle || 'Đang lấy thông tin dịch vụ...'}</p></div>
              <div className="customer-booking-meta-v3"><span><CalendarDays/>{item.ngayBatDau ? `Ngày sử dụng: ${dateOnly(item.ngayBatDau)}` : `Hạn thanh toán: ${dateTime(booking.hetHanThanhToan)}`}</span><span><UsersRound/>Số lượng: {item.soLuong}</span>{info?.description && <span><MapPin/>{info.description}</span>}</div>
            </div>
            <div className="customer-booking-code-v3"><small>Mã đơn</small><b>{booking.maBooking}</b><span>Hạn TT: {dateTime(booking.hetHanThanhToan)}</span></div>
            <div className="customer-booking-price-v3"><strong>{money(booking.tongTien)}</strong><span className={`booking-status-v3 ${bookingStatusTone(booking.trangThai)}`}>{bookingStatusLabel(booking.trangThai)}</span></div>
            <div className="customer-booking-action-v3">{booking.trangThai === 'PENDING_PAYMENT' ? <Link className="pay" to={`/payments/new?bookingId=${booking.id}`}>Thanh toán <ChevronRight/></Link> : <Link to={`/bookings/${booking.id}`}>Xem chi tiết <ChevronRight/></Link>}</div>
          </article>
        })}</div>
        <div className="customer-booking-pagination-v3"><span>Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length} đơn</span><div><button disabled={page === 1} onClick={() => setPage(v => Math.max(1, v - 1))}><ChevronLeft/></button>{Array.from({ length: pages }, (_, i) => i + 1).slice(0, 6).map(n => <button className={page === n ? 'active' : ''} onClick={() => setPage(n)} key={n}>{n}</button>)}<button disabled={page === pages} onClick={() => setPage(v => Math.min(pages, v + 1))}><ChevronRight/></button></div></div>
      </>}
    </div>
  </div>
}
