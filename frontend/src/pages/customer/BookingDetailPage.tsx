import { ArrowLeft, Ban, BedDouble, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Download, Printer, Headphones, Mail, MapPin, Plane, RefreshCcw, ShieldCheck, Star, Ticket, UserRound, UsersRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authApi, bookingApi, paymentApi, reviewApi } from '../../api/services'
import type { Booking, Payment, Profile } from '../../types'
import { apiError, dateOnly, dateTime, money } from '../../utils/format'
import FlightTickets, { type FlightTicketPassenger } from '../../components/FlightTickets'
import AttractionTickets from '../../components/AttractionTickets'
import { bookingStatusLabel, bookingStatusTone, resolveBookingItem, serviceTypeLabel, type BookingPresentation } from '../../utils/bookingPresentation'

function text(value: unknown, fallback = '—') { return typeof value === 'string' && value.trim() ? value : fallback }
function recordArray(value: unknown) { return Array.isArray(value) ? value.filter(v => v && typeof v === 'object') as Array<Record<string, unknown>> : [] }

export default function BookingDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [info, setInfo] = useState<BookingPresentation | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [reason, setReason] = useState('Thay đổi kế hoạch cá nhân')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [ticketsOpen, setTicketsOpen] = useState(false)
  const [attractionTicketsOpen, setAttractionTicketsOpen] = useState(false)
  const [reviewOpen,setReviewOpen]=useState(false),[reviewStars,setReviewStars]=useState(5),[reviewText,setReviewText]=useState(''),[reviewed,setReviewed]=useState(false)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const b = await bookingApi.detail(Number(id))
      setBooking(b)
      const first = b.danhSachDichVu?.[0]
      if (first) { try { setInfo(await resolveBookingItem(first)) } catch { setInfo(null) } }
      const [pay, me] = await Promise.all([
        paymentApi.byBookingCode(b.maBooking).catch(() => null),
        authApi.profile().catch(() => null),
      ])
      setPayment(pay); setProfile(me)
    } catch (e) { setError(apiError(e)) } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [id])

  const item = booking?.danhSachDichVu?.[0]
  const extras = info?.extra || {}
  const passengers = useMemo(() => recordArray(extras.passengers), [extras])
  const selectedSeats = useMemo(() => recordArray(extras.selectedSeats), [extras])
  const guests = useMemo(() => recordArray(extras.guests), [extras])
  const visitors = useMemo(() => recordArray(extras.visitors), [extras])
  const contact = (extras.contact && typeof extras.contact === 'object' ? extras.contact : {}) as Record<string, unknown>

  const cancelBooking = async () => {
    if (!booking) return
    setBusy(true); setError('')
    try {
      const updated = await bookingApi.cancel(booking.id)
      setBooking(updated); setCancelOpen(false); setNotice('Đơn chưa thanh toán đã được hủy thành công.')
    } catch (e) { setError(apiError(e)) } finally { setBusy(false) }
  }

  const requestRefund = async () => {
    if (!booking || !payment || !item) return
    setBusy(true); setError('')
    try {
      const updated = await bookingApi.requestCancellation(booking.id, reason)
      setBooking(updated)
      setRefundOpen(false); setNotice('Yêu cầu hủy/hoàn tiền đã gửi đến Provider; hệ thống tự duyệt khi quá 2 giờ.')
      try { setPayment(await paymentApi.byBookingCode(booking.maBooking)) } catch { /* giữ payment cũ */ }
    } catch (e) { setError(apiError(e)) } finally { setBusy(false) }
  }

  if (loading) return <div className="customer-booking-detail-v3"><div className="container customer-bookings-state-v3">Đang tải chi tiết đơn...</div></div>
  if (error && !booking) return <div className="customer-booking-detail-v3"><div className="container customer-bookings-state-v3 error"><strong>Không thể tải đơn</strong><p>{error}</p></div></div>
  if (!booking || !item) return <div className="customer-booking-detail-v3"><div className="container customer-bookings-state-v3">Không tìm thấy đơn đặt dịch vụ.</div></div>

  const canCancel = booking.trangThai === 'PENDING_PAYMENT'
  const cancellationStart = item.loaiDichVu === 'FLIGHT' && info?.flight?.thoiGianKhoiHanh
    ? new Date(info.flight.thoiGianKhoiHanh).getTime()
    : item.ngayBatDau ? new Date(`${item.ngayBatDau}T00:00:00`).getTime() : 0
  const canRefund = payment?.trangThai === 'SUCCESS' && ['PAID','CONFIRMED'].includes(booking.trangThai)
    && cancellationStart > Date.now()+24*60*60*1000
  const refundPending = booking.trangThai === 'CANCEL_REQUESTED' || payment?.trangThai === 'REFUND_PENDING'
  const attractionTicketsAvailable = item.loaiDichVu === 'ATTRACTION' && payment?.trangThai === 'SUCCESS' && ['PAID', 'CONFIRMED', 'COMPLETED'].includes(booking.trangThai) && !!info?.attraction && !!info?.ticket
  const reviewEnd = item.loaiDichVu === 'FLIGHT' && info?.flight?.thoiGianDen ? new Date(info.flight.thoiGianDen).getTime() : item.loaiDichVu === 'HOTEL' && item.ngayKetThuc ? new Date(`${item.ngayKetThuc}T00:00:00`).getTime() : item.loaiDichVu === 'ATTRACTION' && item.ngayBatDau ? new Date(`${item.ngayBatDau}T23:59:59`).getTime() : Number.POSITIVE_INFINITY
  const canReview = payment?.trangThai === 'SUCCESS' && Date.now() >= reviewEnd && !reviewed
  const submitReview=async()=>{if(!booking||!item||!info)return;setBusy(true);setError('');try{if(item.loaiDichVu==='HOTEL'&&info.hotel)await reviewApi.createHotel({bookingId:booking.id,targetId:info.hotel.id,soSao:reviewStars,noiDung:reviewText});else if(item.loaiDichVu==='ATTRACTION'&&info.attraction)await reviewApi.createAttraction({bookingId:booking.id,targetId:info.attraction.id,soSao:reviewStars,noiDung:reviewText});else if(item.loaiDichVu==='FLIGHT'&&info.flight)await reviewApi.createFlight({bookingId:booking.id,targetId:info.flight.id,soSao:reviewStars,noiDung:reviewText});setReviewed(true);setReviewOpen(false);setNotice('Cảm ơn bạn đã đánh giá dịch vụ.')}catch(e){setError(apiError(e))}finally{setBusy(false)}}
  const flightTicketsAvailable = item.loaiDichVu === 'FLIGHT' && payment?.trangThai === 'SUCCESS' && ['PAID', 'CONFIRMED', 'COMPLETED'].includes(booking.trangThai) && !!info?.flight && passengers.length > 0 && selectedSeats.length === passengers.length

  return <div className="customer-booking-detail-v3"><div className="container booking-detail-wrap-v3">
    <div className="booking-detail-breadcrumb-v3"><Link to="/bookings"><ArrowLeft/>Đơn đặt dịch vụ</Link><span>›</span><b>Chi tiết đơn</b><span>›</span>{booking.maBooking}</div>
    <div className="booking-detail-head-v3"><div><h1>Chi tiết đơn đặt dịch vụ</h1><p>Mã đơn: <strong>{booking.maBooking}</strong> <span className={`booking-status-v3 ${bookingStatusTone(booking.trangThai)}`}>{bookingStatusLabel(booking.trangThai)}</span></p></div><div><span>Hạn thanh toán</span><b>{dateTime(booking.hetHanThanhToan)}</b>{payment && <small>Thanh toán: {payment.phuongThuc}</small>}</div></div>
    {notice && <div className="booking-detail-notice-v3"><CheckCircle2/><span>{notice}</span><button onClick={() => setNotice('')}><X/></button></div>}
    {error && <div className="form-alert">{error}</div>}

    <div className="booking-detail-layout-v3"><main>
      <section className={`booking-service-hero-v3 type-${item.loaiDichVu.toLowerCase()}`}>
        <div className="booking-service-visual-v3">{info?.image ? <img src={info.image} alt=""/> : item.loaiDichVu === 'FLIGHT' ? <Plane/> : item.loaiDichVu === 'HOTEL' ? <BedDouble/> : <Ticket/>}</div>
        <div className="booking-service-copy-v3"><span>{serviceTypeLabel(item.loaiDichVu)}</span><h2>{info?.title || `${serviceTypeLabel(item.loaiDichVu)} #${item.dichVuId}`}</h2><p>{info?.description || info?.subtitle}</p>{info?.subtitle && <small>{info.subtitle}</small>}</div>
        <Link to={item.loaiDichVu === 'FLIGHT' ? `/flights/${item.dichVuId}` : item.loaiDichVu === 'HOTEL' && info?.hotel ? `/hotels/${info.hotel.id}` : item.loaiDichVu === 'ATTRACTION' && info?.attraction ? `/attractions/${info.attraction.id}` : '#'}>Xem dịch vụ</Link>
      </section>

      {item.loaiDichVu === 'FLIGHT' && info?.flight && <section className="booking-detail-card-v3 flight-detail-card-v3"><h3>Thông tin chuyến bay</h3><div className="booking-route-v3"><div><strong>{info.flight.sanBayDi}</strong><span>{info.flight.diemDi}</span><b>{new Date(info.flight.thoiGianKhoiHanh).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b><small>{dateOnly(info.flight.thoiGianKhoiHanh)}</small></div><div className="route-line-v3"><Plane/><i/></div><div><strong>{info.flight.sanBayDen}</strong><span>{info.flight.diemDen}</span><b>{new Date(info.flight.thoiGianDen).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b><small>{dateOnly(info.flight.thoiGianDen)}</small></div></div><div className="booking-facts-v3"><span><Plane/><small>Hãng bay</small><b>{info.flight.hangHangKhong}</b></span><span><Ticket/><small>Mã chuyến</small><b>{info.flight.maChuyenBay}</b></span><span><UsersRound/><small>Số hành khách</small><b>{item.soLuong}</b></span></div></section>}

      {item.loaiDichVu === 'HOTEL' && info?.hotel && info.room && <section className="booking-detail-card-v3"><h3>Thông tin đặt phòng</h3><div className="booking-stay-dates-v3"><span><CalendarDays/><small>Nhận phòng</small><b>{dateOnly(item.ngayBatDau)}</b></span><span><Clock3/><small>Trả phòng</small><b>{dateOnly(item.ngayKetThuc)}</b></span><span><BedDouble/><small>Loại phòng</small><b>{info.room.tenLoaiPhong}</b></span><span><UsersRound/><small>Sức chứa</small><b>{info.room.sucChua} khách/phòng</b></span></div><p className="booking-address-v3"><MapPin/>{info.hotel.diaChi}, {info.hotel.thanhPho}</p></section>}

      {item.loaiDichVu === 'ATTRACTION' && info?.attraction && info.ticket && <section className="booking-detail-card-v3"><h3>Thông tin vé tham quan</h3><div className="booking-stay-dates-v3"><span><CalendarDays/><small>Ngày tham quan</small><b>{dateOnly(item.ngayBatDau)}</b></span><span><Ticket/><small>Loại vé</small><b>{info.ticket.tenLoaiVe}{info.ticket.doiTuongApDung ? ` · ${info.ticket.doiTuongApDung}` : ''}</b></span><span><UsersRound/><small>Số lượng</small><b>{item.soLuong} vé</b></span><span><Clock3/><small>Giờ hoạt động</small><b>{info.attraction.gioMoCua} - {info.attraction.gioDongCua}</b></span></div><p className="booking-address-v3"><MapPin/>{[info.attraction.diaChi, info.attraction.quanHuyen, info.attraction.thanhPho].filter(Boolean).join(', ')}</p></section>}

      <section className="booking-detail-card-v3"><h3>Thông tin khách hàng</h3><div className="booking-customer-grid-v3"><span><UserRound/><small>Họ và tên</small><b>{text(contact.hoTen, profile?.hoTen || '—')}</b></span><span><Mail/><small>Email</small><b>{text(contact.email, profile?.email || '—')}</b></span><span><Headphones/><small>Số điện thoại</small><b>{text(contact.soDienThoai, profile?.soDienThoai || '—')}</b></span></div>{passengers.length > 0 && <PeopleTable title="Thông tin hành khách" rows={passengers}/>} {guests.length > 0 && <PeopleTable title="Thông tin khách lưu trú" rows={guests}/>} {visitors.length > 0 && <PeopleTable title="Thông tin người tham quan" rows={visitors}/>}</section>

      {item.thongTinBoSung && <section className="booking-detail-card-v3"><h3>Thông tin bổ sung</h3><p className="booking-extra-note-v3">Thông tin này được lưu trong <code>thongTinBoSung</code> của Booking Service. Các giá trị không có bảng giá riêng không được frontend tự cộng vào tổng tiền.</p>{text(extras.note, '') && <p>{text(extras.note)}</p>}</section>}
      <Link className="booking-back-link-v3" to="/bookings"><ArrowLeft/>Quay lại danh sách đơn</Link>
    </main>

    <aside className="booking-payment-summary-v3"><section><h3>Tổng thanh toán</h3><p><span>Tạm tính</span><b>{money(booking.tongTienGoc)}</b></p>{booking.maUuDai && <p><span>Mã ưu đãi</span><b>{booking.maUuDai}</b></p>}{Number(booking.soTienGiam) > 0 && <p className="discount"><span>Giảm giá</span><b>- {money(booking.soTienGiam)}</b></p>}<div className="booking-grand-total-v3"><span>Tổng thanh toán</span><strong>{money(booking.tongTien)}</strong></div></section>
      <div className={`booking-payment-state-v3 ${payment?.trangThai === 'SUCCESS' ? 'success' : refundPending ? 'pending' : ''}`}><CircleDollarSign/><div><b>{payment ? `Thanh toán: ${payment.trangThai}` : bookingStatusLabel(booking.trangThai)}</b><span>{payment ? `Mã thanh toán ${payment.maThanhToan}` : 'Chưa có Payment cho Booking này'}</span></div></div>
      {booking.trangThai === 'PENDING_PAYMENT' && <Link className="booking-primary-action-v3" to={`/payments/new?bookingId=${booking.id}`}>Thanh toán ngay</Link>}
      {canCancel && <button className="booking-outline-danger-v3" onClick={() => setCancelOpen(true)}><Ban/>Hủy đơn</button>}
      {canRefund && <button className="booking-outline-danger-v3" onClick={() => setRefundOpen(true)}><RefreshCcw/>Yêu cầu hoàn tiền</button>}
      {booking.lyDoTuChoiHuy && <p role="status">Lý do từ chối gần nhất: {booking.lyDoTuChoiHuy}</p>}
      {refundPending && <div className="booking-refund-pending-v3"><RefreshCcw/><span>Yêu cầu hủy/hoàn tiền đang chờ Provider (tối đa 2 giờ).</span></div>}
      {item.loaiDichVu === 'FLIGHT' && (flightTicketsAvailable ? <button className="booking-primary-action-v3" onClick={() => setTicketsOpen(true)}><Ticket/>Xem vé máy bay</button> : <div className="flight-ticket-locked">{payment?.trangThai !== 'SUCCESS' ? 'Vé chỉ hiển thị sau khi thanh toán được xác nhận.' : ['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(booking.trangThai) ? 'Đơn đã hủy hoặc hoàn tiền, không thể xem vé.' : 'Chưa đủ thông tin hành khách/ghế để xuất vé.'}</div>)}
      {canReview && <button className="booking-primary-action-v3" onClick={()=>setReviewOpen(true)}><Star/>Đánh giá</button>}
      {item.loaiDichVu === 'ATTRACTION' && (attractionTicketsAvailable ? <button className="booking-primary-action-v3" onClick={() => setAttractionTicketsOpen(true)}><Ticket/>Xem vé tham quan</button> : <div className="flight-ticket-locked">{payment?.trangThai !== 'SUCCESS' ? 'Vé chỉ hiển thị sau khi thanh toán được xác nhận.' : ['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(booking.trangThai) ? 'Đơn đã hủy hoặc hoàn tiền, không thể xem vé.' : 'Chưa đủ thông tin để xuất vé tham quan.'}</div>)}
      <button className="booking-outline-action-v3" onClick={() => window.print()}><Download/>In / lưu hóa đơn</button>
      <Link className="booking-outline-action-v3" to="/ai"><Headphones/>Liên hệ hỗ trợ</Link>
      <div className="booking-help-v3"><ShieldCheck/><div><b>Thông tin được xác nhận bởi hệ thống</b><span>Giá, trạng thái và ưu đãi được kiểm tra trước khi hiển thị.</span></div></div>
    </aside></div>
  </div>

  {attractionTicketsOpen && attractionTicketsAvailable && info?.attraction && info?.ticket && <AttractionTickets
    bookingCode={booking.maBooking}
    bookingId={booking.id}
    attraction={info.attraction}
    ticket={info.ticket}
    visitDate={item.ngayBatDau}
    quantity={item.soLuong}
    customerName={text(contact.hoTen, profile?.hoTen || '—')}
    onClose={() => setAttractionTicketsOpen(false)}
  />}
  {ticketsOpen && flightTicketsAvailable && info?.flight && <FlightTickets
    bookingCode={booking.maBooking}
    bookingId={booking.id}
    flight={info.flight}
    passengers={passengers as FlightTicketPassenger[]}
    selectedSeats={selectedSeats}
    onClose={() => setTicketsOpen(false)}
  />}
  {cancelOpen && <div className="booking-modal-backdrop-v3" onMouseDown={() => setCancelOpen(false)}><div className="booking-action-modal-v3" onMouseDown={e => e.stopPropagation()}><button className="booking-modal-x-v3" onClick={() => setCancelOpen(false)}>×</button><span className="booking-modal-icon-v3 danger"><Ban/></span><h2>Hủy đơn đặt dịch vụ</h2><p>Bạn có chắc muốn hủy đơn <strong>{booking.maBooking}</strong>?</p><div className="booking-modal-info-v3"><b>Lưu ý</b><span>Chỉ đơn chưa thanh toán được hủy trực tiếp. Đơn đã thanh toán cần gửi yêu cầu hoàn tiền.</span></div><div className="booking-modal-actions-v3"><button onClick={() => setCancelOpen(false)}>Quay lại</button><button className="danger" disabled={busy} onClick={() => void cancelBooking()}>{busy ? 'Đang xử lý...' : 'Xác nhận hủy'}</button></div></div></div>}

  {reviewOpen&&<div className="booking-modal-backdrop-v3" onMouseDown={()=>setReviewOpen(false)}><div className="booking-action-modal-v3" onMouseDown={e=>e.stopPropagation()}><button className="booking-modal-x-v3" onClick={()=>setReviewOpen(false)}>×</button><span className="booking-modal-icon-v3"><Star/></span><h2>Đánh giá dịch vụ</h2><div className="booking-review-stars">{[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=reviewStars?'active':''} onClick={()=>setReviewStars(n)}>★</button>)}</div><label className="booking-refund-reason-v3">Nhận xét<textarea maxLength={2000} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..."/></label><div className="booking-modal-actions-v3"><button onClick={()=>setReviewOpen(false)}>Để sau</button><button disabled={busy} onClick={()=>void submitReview()}>{busy?'Đang gửi...':'Gửi đánh giá'}</button></div></div></div>}
  {refundOpen && <div className="booking-modal-backdrop-v3" onMouseDown={() => setRefundOpen(false)}><div className="booking-action-modal-v3" onMouseDown={e => e.stopPropagation()}><button className="booking-modal-x-v3" onClick={() => setRefundOpen(false)}>×</button><span className="booking-modal-icon-v3"><RefreshCcw/></span><h2>Yêu cầu hoàn tiền</h2><p>Hệ thống sẽ tạo yêu cầu hoàn tiền cho giao dịch <strong>{payment?.maThanhToan}</strong>.</p><div className="booking-refund-amount-v3"><span>Số tiền yêu cầu hoàn</span><strong>{money(Number(booking.tongTienGoc || 0) > 0 ? Math.min(Number(booking.tongTien), Math.round((Number(item.thanhTien || 0) / Number(booking.tongTienGoc)) * Number(booking.tongTien))) : Number(booking.tongTien))}</strong></div><label className="booking-refund-reason-v3">Lý do<select value={reason} onChange={e => setReason(e.target.value)}><option>Thay đổi kế hoạch cá nhân</option><option>Không thể sử dụng dịch vụ</option><option>Đặt nhầm dịch vụ</option><option>Lý do khác</option></select></label><div className="booking-modal-info-v3"><b>Lưu ý</b><span>Yêu cầu sẽ được kiểm tra trước khi khoản tiền hoàn được xác nhận.</span></div><div className="booking-modal-actions-v3"><button onClick={() => setRefundOpen(false)}>Quay lại</button><button className="danger" disabled={busy} onClick={() => void requestRefund()}>{busy ? 'Đang gửi...' : 'Gửi yêu cầu hoàn tiền'}</button></div></div></div>}
  </div>
}

function PeopleTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  return <div className="booking-people-v3"><h4>{title}</h4><div>{rows.map((row, index) => {
    const fullName = [row.ho, row.tenDem, row.ten].filter(v => typeof v === 'string' && v).join(' ') || text(row.hoTen, `Khách ${index + 1}`)
    return <span key={index}><b>{index + 1}. {fullName}</b><small>{text(row.ngaySinh, '')}{row.quocTich ? ` · ${text(row.quocTich)}` : ''}{row.giayTo ? ` · ${text(row.giayTo)}` : ''}</small></span>
  })}</div></div>
}
