import { ArrowLeft, CheckCircle2, Clock3, Download, Headphones, Home, Hotel as HotelIcon, MapPin, Plane, ShieldCheck, Ticket, WalletCards } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { attractionApi, bookingApi, flightApi, hotelApi, paymentApi } from '../../api/services'
import type { Attraction, Booking, Flight, Hotel, Payment, Room, ServiceType, TicketType } from '../../types'
import { apiError, dateTime, money } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'

type BookingExtra = {
  contact?: { hoTen?: string; email?: string; soDienThoai?: string }
  passengers?: Array<{ hoTen?: string; maGhe?: string; hangVe?: string; ngaySinh?: string; quocTich?: string; cccd?: string; hoChieu?: string; giayTo?: string }>
  selectedSeats?: Array<{ maGhe?: string; hangVe?: string; giaVe?: number }>
  guests?: Array<{ hoTen?: string; ngaySinh?: string; quocTich?: string; giayTo?: string }>
  visitors?: Array<{ hoTen?: string; ngaySinh?: string; quocTich?: string; giayTo?: string }>
}
type ServiceDetails = { flight: Flight|null; hotel: Hotel|null; room: Room|null; attraction: Attraction|null; ticket: TicketType|null }

function hm(value: string) { return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
function date(value: string) { return new Date(value).toLocaleDateString('vi-VN') }
function parseExtra(value?: string | null): BookingExtra { try { return value ? JSON.parse(value) as BookingExtra : {} } catch { return {} } }
function bookingType(booking:Booking|null):ServiceType { return booking?.danhSachDichVu?.[0]?.loaiDichVu || 'FLIGHT' }
function stepLabels(type:ServiceType){return type==='HOTEL'?['Chọn phòng','Thông tin khách','Thanh toán','Xác nhận']:type==='ATTRACTION'?['Chọn vé','Thông tin khách hàng','Thanh toán','Xác nhận']:['Chọn ghế','Thông tin hành khách','Thanh toán','Xác nhận']}

export default function PaymentsPage() {
  const [sp] = useSearchParams();const bookingId = Number(sp.get('bookingId'))
  const [payment, setPayment] = useState<Payment | null>(null);const [booking, setBooking] = useState<Booking | null>(null)
  const [details,setDetails]=useState<ServiceDetails>({flight:null,hotel:null,room:null,attraction:null,ticket:null})
  const [error, setError] = useState('');const [loading, setLoading] = useState(true);const [paypalBusy,setPaypalBusy]=useState(false);const [notice,setNotice]=useState('');const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!bookingId) { setError('Thiếu bookingId.'); setLoading(false); return }
    let active = true
    const init = async () => {
      try {
        const b = await bookingApi.detail(bookingId);if (!active) return;setBooking(b)
        if (b.trangThai === 'EXPIRED' || b.trangThai === 'CANCELLED' ||
            (b.trangThai === 'PENDING_PAYMENT' && b.hetHanThanhToan && new Date(b.hetHanThanhToan).getTime() <= Date.now())) {
          setError('Đơn đã hết hạn thanh toán và bị hủy. Vui lòng đặt lại dịch vụ.');return
        }
        const first = b.danhSachDichVu?.[0]
        if (first?.loaiDichVu === 'FLIGHT') { try { const flight=await flightApi.detail(first.dichVuId);setDetails(d=>({...d,flight})) } catch { /* keep summary */ } }
        if (first?.loaiDichVu === 'HOTEL') { try { const room=await hotelApi.room(first.dichVuId);const hotel=await hotelApi.detail(room.khachSanId);setDetails(d=>({...d,room,hotel})) } catch { /* keep summary */ } }
        if (first?.loaiDichVu === 'ATTRACTION') { try { const ticket=await attractionApi.ticket(first.dichVuId);const attraction=await attractionApi.detail(ticket.diaDiemId);setDetails(d=>({...d,ticket,attraction})) } catch { /* keep summary */ } }
        const paypalToken=sp.get('token')
        if(paypalToken&&sp.get('paypal')==='return'){
          const p=await paymentApi.capturePaypal(paypalToken);if(!active)return;setPayment(p);setNotice('PayPal đã xác nhận thanh toán thành công.')
        }else{
          if(sp.get('paypal')==='cancel')setNotice('Bạn đã hủy thanh toán PayPal. Có thể thử thanh toán lại.')
          if(sp.get('cancel')==='true')setNotice('Bạn đã hủy thao tác thanh toán PayOS.')
          try { const p=await paymentApi.byBookingCode(b.maBooking);if(active)setPayment(p) } catch { /* No payment yet. */ }
        }
        try { setBooking(await bookingApi.detail(bookingId)) } catch { /* Payment amount remains authoritative */ }
      } catch (e) { if (active) setError(apiError(e)) } finally { if (active) setLoading(false) }
    }
    void init();return () => { active = false; window.clearInterval(timer.current) }
  }, [bookingId])

  useEffect(() => {
    if (!payment || payment.trangThai !== 'PENDING') return
    timer.current = window.setInterval(async () => { try { const next = await paymentApi.status(payment.id);setPayment(next);if (next.trangThai !== 'PENDING') window.clearInterval(timer.current) } catch { /* keep current UI */ } }, 5000)
    return () => window.clearInterval(timer.current)
  }, [payment?.id, payment?.trangThai])

  const startPayment=async(method:'PAYPAL'|'PAYOS')=>{
    if(!bookingId)return
    setPaypalBusy(true);setError('')
    try{
      if(payment?.trangThai==='PENDING'&&payment.phuongThuc!==method) await paymentApi.cancel(payment.id)
      const p = payment?.trangThai === 'PENDING' && payment.phuongThuc === method ? payment : await paymentApi.create(bookingId,`${method.toLowerCase()}-${bookingId}-${crypto.randomUUID()}`,method)
      setPayment(p)
      const url=method==='PAYOS'?p.payosCheckoutUrl:p.paypalApprovalUrl
      if(!url)throw new Error(`Chưa thể mở ${method}. Vui lòng thử lại.`)
      window.location.assign(url)
    }catch(e){setError(apiError(e));setPaypalBusy(false)}
  }

  if (loading) return <div className="container pad"><Loading label="Đang khởi tạo thanh toán..."/></div>
  if (error) return <div className="container pad"><ErrorState message={error}/><Link to="/bookings">Quay lại đơn hàng</Link></div>
  const success = payment?.trangThai === 'SUCCESS';const type=bookingType(booking)
  return <div className={`flight-payment-page travel-payment-v2 payment-${type.toLowerCase()}`}><div className="container flight-payment-wrap">
    <div className="flight-ref-breadcrumb">Trang chủ <span>›</span> {type==='HOTEL'?'Khách sạn':type==='ATTRACTION'?'Địa điểm tham quan':'Chuyến bay'} <span>›</span> {success ? 'Xác nhận' : 'Thanh toán'}</div>
    {success && payment ? <PaymentSuccess payment={payment} booking={booking} details={details}/> : <PendingPayment payment={payment} booking={booking} details={details} onPayment={startPayment} paypalBusy={paypalBusy} notice={notice}/>} 
  </div></div>
}

function PendingPayment({ payment, booking, details, onPayment, paypalBusy, notice }: { payment: Payment | null; booking: Booking | null; details:ServiceDetails; onPayment:(method:'PAYPAL'|'PAYOS')=>void; paypalBusy:boolean; notice:string }) {
  const type=bookingType(booking);const labels=stepLabels(type)
  return <>
    <div className="booking-title"><h1>Thanh toán</h1><p>Vui lòng hoàn tất thanh toán trước thời hạn để giữ Booking.</p></div>
    <div className="booking-stepper travel-payment-stepper-v2">{labels.map((label,i)=><div className={i<2?'done':i===2?'active':''} key={label}><b>{i<2?'✓':i+1}</b><span>{label}</span>{i<labels.length-1&&<i/>}</div>)}</div>
    <div className="booking-layout payment-layout"><main>
      <section className="booking-form-card"><h2>Phương thức thanh toán</h2><p className="booking-hint">Chọn PayOS để thanh toán bằng ngân hàng Việt Nam hoặc PayPal.</p>{notice&&<div className="form-alert">{notice}</div>}<div className="payment-methods-real"><button type="button" className="payment-method-card paypal" onClick={()=>onPayment('PAYOS')} disabled={paypalBusy}><WalletCards/><div><strong>Thanh toán bằng PayOS</strong><span>Chuyển khoản ngân hàng, quét mã QR</span></div><b>PayOS</b></button><button type="button" className="payment-method-card paypal" onClick={()=>onPayment('PAYPAL')} disabled={paypalBusy}><WalletCards/><div><strong>Thanh toán bằng PayPal</strong><span>Thanh toán qua tài khoản PayPal</span></div><b>PayPal</b></button></div></section>
      <section className="booking-form-card"><h2>Hoàn tất thanh toán</h2><p className="booking-hint">Chọn phương thức ở trên để tiếp tục. Trạng thái đơn được xác nhận sau khi cổng thanh toán gửi kết quả về hệ thống.</p></section>
      <div className="booking-bottom-actions"><Link to="/bookings"><ArrowLeft/>Đơn của tôi</Link><span className="payment-security"><ShieldCheck/> Giao dịch được hệ thống xác nhận</span></div>
    </main><aside>{payment?<PaymentOrderSummary payment={payment} booking={booking} details={details}/>:<section className="booking-order-card"><h3>Tóm tắt đơn hàng</h3><p>Mã Booking: {booking?.maBooking}</p><div className="summary-line total"><span>Tổng cộng</span><strong>{money(booking?.tongTien||0)}</strong></div></section>}<section className="booking-support"><Headphones/><div><strong>Cần hỗ trợ?</strong><span>Mã Booking: {booking?.maBooking}</span></div></section></aside></div>
  </>
}

function PaymentSuccess({ payment, booking, details }: { payment: Payment; booking: Booking | null; details:ServiceDetails }) {
  const type=bookingType(booking);const labels=stepLabels(type);const extra=parseExtra(booking?.danhSachDichVu?.[0]?.thongTinBoSung)
  const title=type==='HOTEL'?'Đặt phòng thành công!':type==='ATTRACTION'?'Đặt vé thành công!':'Đặt vé thành công!'
  return <>
    <div className="booking-stepper travel-payment-stepper-v2 success-stepper">{labels.map((label,i)=><div className="done" key={label}><b>✓</b><span>{label}</span>{i<labels.length-1&&<i/>}</div>)}</div>
    <div className="booking-layout success-layout"><main className="payment-success-ref">
      <section className="success-header"><span><CheckCircle2/></span><h1>{title}</h1><p>Thanh toán đã được ghi nhận thành công.</p></section>
      <section className="success-mail"><CheckCircle2/><div><strong>Thanh toán đã được xác nhận</strong><span>{extra.contact?.email ? `Thông tin đặt dịch vụ được ghi nhận cho ${extra.contact.email}.` : 'Bạn có thể xem lại thông tin trong mục Đơn đặt dịch vụ.'}</span></div></section>
      <section className="success-code-grid"><div><span>Mã Booking</span><strong>{payment.maBooking}</strong></div><div><span>Mã thanh toán</span><strong>{payment.maThanhToan}</strong></div><div><span>Trạng thái</span><strong className="success-status"><CheckCircle2/>Đã thanh toán</strong></div></section>
      <SuccessServiceCard booking={booking} details={details}/>
      {(extra.passengers?.length||extra.guests?.length||extra.visitors?.length) ? <section className="booking-form-card"><h2>Thông tin khách</h2><div className="success-passenger-list">{(extra.passengers||extra.guests||extra.visitors||[]).map((p:any,i:number)=><div key={i}><b>{i+1}</b><span>{p.hoTen||`Khách ${i+1}`}</span><small>{p.ngaySinh||'—'} · {p.quocTich||'—'} · {p.cccd||p.hoChieu||p.giayTo||'—'}</small></div>)}</div></section>:null}
      <div className="success-actions"><Link to={`/bookings/${payment.bookingId}`}><Download/>Xem Booking</Link><Link to="/bookings"><CheckCircle2/>Quản lý đơn</Link><Link className="home" to="/"><Home/>Về trang chủ</Link></div>
    </main><aside><PaymentOrderSummary payment={payment} booking={booking} details={details}/><section className="success-help"><Headphones/><div><strong>Bạn cần hỗ trợ?</strong><span>Dùng mã Booking khi liên hệ hỗ trợ.</span></div></section></aside></div>
  </>
}

function SuccessServiceCard({booking,details}:{booking:Booking|null;details:ServiceDetails}){
  const first=booking?.danhSachDichVu?.[0];if(!first)return null
  if(first.loaiDichVu==='FLIGHT'&&details.flight)return <section className="booking-form-card success-flight"><h2><Plane/> Thông tin chuyến bay</h2><div className="success-flight-row"><div><strong>{details.flight.hangHangKhong}</strong><span>{details.flight.maChuyenBay}</span></div><div><strong>{hm(details.flight.thoiGianKhoiHanh)}</strong><span>{details.flight.diemDi}</span><small>{date(details.flight.thoiGianKhoiHanh)}</small></div><Plane/><div><strong>{hm(details.flight.thoiGianDen)}</strong><span>{details.flight.diemDen}</span><small>{date(details.flight.thoiGianDen)}</small></div></div></section>
  if(first.loaiDichVu==='HOTEL'&&details.hotel&&details.room)return <section className="booking-form-card success-travel-service-v2"><h2><HotelIcon/> Thông tin đặt phòng</h2><div><strong>{details.hotel.tenKhachSan}</strong><span><MapPin/>{details.hotel.diaChi}</span><b>{details.room.tenLoaiPhong}</b><small>{first.ngayBatDau||'—'} → {first.ngayKetThuc||'—'} · {first.soLuong} phòng</small></div></section>
  if(first.loaiDichVu==='ATTRACTION'&&details.attraction&&details.ticket)return <section className="booking-form-card success-travel-service-v2"><h2><Ticket/> Thông tin vé tham quan</h2><div><strong>{details.attraction.tenDiaDiem}</strong><span><MapPin/>{details.attraction.diaChi}</span><b>{details.ticket.tenLoaiVe}</b><small>{first.ngayBatDau||'—'} · {first.soLuong} vé</small></div></section>
  return null
}

function PaymentOrderSummary({ payment, booking, details }: { payment: Payment; booking: Booking | null; details:ServiceDetails }) {
  const first=booking?.danhSachDichVu?.[0];const qty=first?.soLuong||1
  return <section className="booking-order-card"><h3>Tóm tắt đơn hàng</h3>
    {first?.loaiDichVu==='FLIGHT'&&details.flight?<><div className="summary-airline"><Plane/><div><strong>{details.flight.hangHangKhong}</strong><span>{details.flight.maChuyenBay}</span></div></div><div className="summary-route"><div><strong>{hm(details.flight.thoiGianKhoiHanh)}</strong><span>{details.flight.diemDi}</span></div><Plane/><div><strong>{hm(details.flight.thoiGianDen)}</strong><span>{details.flight.diemDen}</span></div></div>{parseExtra(first.thongTinBoSung).selectedSeats?.length ? <div className="flight-payment-seat-summary">{Object.entries((parseExtra(first.thongTinBoSung).selectedSeats||[]).reduce((acc:any,s:any)=>{const k=s.hangVe||'Hạng vé';acc[k]=(acc[k]||0)+Number(s.giaVe||0);return acc},{})).map(([k,v])=><div key={k}><span>{k}</span><strong>{money(Number(v))}</strong></div>)}</div>:null}<div className="summary-line"><span>Hành khách</span><strong>{qty} người</strong></div></>:null}
    {first?.loaiDichVu==='HOTEL'&&details.hotel&&details.room?<><div className="summary-airline"><HotelIcon/><div><strong>{details.hotel.tenKhachSan}</strong><span>{details.room.tenLoaiPhong}</span></div></div><div className="summary-line"><span>Thời gian</span><strong>{first.ngayBatDau} → {first.ngayKetThuc}</strong></div><div className="summary-line"><span>Số phòng</span><strong>{qty}</strong></div></>:null}
    {first?.loaiDichVu==='ATTRACTION'&&details.attraction&&details.ticket?<><div className="summary-airline"><Ticket/><div><strong>{details.attraction.tenDiaDiem}</strong><span>{details.ticket.tenLoaiVe}</span></div></div><div className="summary-line"><span>Ngày tham quan</span><strong>{first.ngayBatDau||'—'}</strong></div><div className="summary-line"><span>Số vé</span><strong>{qty}</strong></div></>:null}
    {!first&&<p>Mã Booking <strong>{payment.maBooking}</strong></p>}
    <div className="summary-line"><span>Giá ban đầu</span><strong>{money(booking?.tongTienGoc ?? booking?.tongTien ?? payment.soTien)}</strong></div>{booking?.maUuDai&&<><div className="summary-line"><span>Mã ưu đãi</span><strong>{booking.maUuDai}</strong></div><div className="summary-line"><span>Giảm giá</span><strong>-{money(booking.soTienGiam||0)}</strong></div></>}<div className="summary-line total"><span>Tổng cộng</span><strong>{money(payment.soTien)}</strong></div><div className="booking-trust"><ShieldCheck/><span>Tổng tiền và ưu đãi đã được hệ thống kiểm tra trước khi thanh toán.</span></div><p className="payment-expiry"><Clock3/> Hết hạn: {dateTime(payment.hetHanLuc)}</p></section>
}
