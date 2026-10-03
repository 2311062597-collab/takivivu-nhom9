import { useState } from 'react'
import { Download, Plane, Printer, Ticket, X } from 'lucide-react'
import type { Flight } from '../types'
import { dateOnly } from '../utils/format'

export type FlightTicketPassenger = Record<string, unknown>
type Seat = Record<string, unknown>
type Props = { bookingCode: string; bookingId: number; flight: Flight; passengers: FlightTicketPassenger[]; selectedSeats: Seat[]; onClose: () => void }

const safeText = (value: unknown, fallback = '—') => typeof value === 'string' && value.trim() ? value.trim() : fallback
const passengerName = (p: FlightTicketPassenger) => safeText(p.hoTen, [p.ho, p.tenDem, p.ten].filter(Boolean).join(' '))
const clock = (value: string) => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

/** Internal receipt reference only: not an airline-issued ticket number or check-in QR. */
function reference(bookingId: number, index: number) { return `TKV-${String(bookingId).padStart(8, '0')}-${String(index + 1).padStart(2, '0')}` }

export default function FlightTickets({ bookingCode, bookingId, flight, passengers, selectedSeats, onClose }: Props) {
  const [active, setActive] = useState(0)
  const passenger = passengers[active]
  const seat = selectedSeats[active]
  if (!passenger || !seat) return null
  const printTicket = () => window.print()
  return <div className="flight-ticket-overlay" role="presentation" onMouseDown={onClose}>
    <div className="flight-ticket-dialog" role="dialog" aria-modal="true" aria-label="Vé máy bay điện tử" onMouseDown={e => e.stopPropagation()}>
      <header className="flight-ticket-dialog-head"><div><h2>Vé máy bay điện tử</h2><p>Đơn {bookingCode} · {passengers.length} hành khách</p></div><button type="button" aria-label="Đóng" onClick={onClose}><X/></button></header>
      <div className="flight-ticket-dialog-body">
        <nav className="flight-ticket-passengers" aria-label="Danh sách vé">
          <h3>Danh sách vé</h3>
          {passengers.map((p, i) => <button type="button" key={i} className={active === i ? 'active' : ''} onClick={() => setActive(i)}><strong>{passengerName(p)}</strong><small>Ghế {safeText(selectedSeats[i]?.maGhe)} · {reference(bookingId, i)}</small></button>)}
        </nav>
        <div className="flight-ticket-main">
          <div className="flight-ticket-print-area" key={active}>
            <div className="flight-ticket-banner"><div><Plane/><strong>{flight.hangHangKhong}</strong></div><span>VÉ ĐIỆN TỬ / E-TICKET</span><b>{safeText(seat.hangVe, flight.hangVe)}</b></div>
            <div className="flight-ticket-paper">
              <div className="flight-ticket-identity"><div><small>Hành khách / Passenger</small><strong>{passengerName(passenger)}</strong></div><div><small>Mã đặt chỗ / Booking</small><strong>{bookingCode}</strong></div></div>
              <div className="flight-ticket-route"><div><small>Đi từ / From</small><strong>{flight.diemDi}</strong><b>{flight.sanBayDi}</b></div><div className="flight-ticket-route-line"><Plane/></div><div><small>Đến / To</small><strong>{flight.diemDen}</strong><b>{flight.sanBayDen}</b></div></div>
              <div className="flight-ticket-facts"><div><small>Ngày khởi hành</small><b>{dateOnly(flight.thoiGianKhoiHanh)}</b></div><div><small>Giờ khởi hành</small><b>{clock(flight.thoiGianKhoiHanh)}</b></div><div><small>Giờ đến</small><b>{clock(flight.thoiGianDen)}</b></div><div><small>Chuyến bay</small><b>{flight.maChuyenBay}</b></div></div>
              <div className="flight-ticket-facts"><div><small>Số ghế</small><b>{safeText(seat.maGhe)}</b></div><div><small>Hạng vé</small><b>{safeText(seat.hangVe, flight.hangVe)}</b></div><div className="flight-ticket-reference"><small>Mã tham chiếu TAKIVIVU</small><b>{reference(bookingId, active)}</b></div></div>
              <div className="flight-ticket-disclaimer"><Ticket/> Đây là xác nhận đặt chỗ từ TAKIVIVU, không phải thẻ lên máy bay. Mã vé hãng hàng không, mã QR check-in và cửa khởi hành chỉ hiển thị khi có dữ liệu xác thực từ hãng.</div>
            </div>
          </div>
          <div className="flight-ticket-actions"><button type="button" onClick={onClose}>Đóng</button><button type="button" onClick={printTicket}><Printer/> In vé</button><button type="button" className="primary" onClick={printTicket}><Download/> Lưu PDF</button></div>
          <p className="flight-ticket-save-help">Để lưu PDF, chọn “Save as PDF / Lưu dưới dạng PDF” trong hộp thoại in.</p>
        </div>
      </div>
    </div>
  </div>
}
