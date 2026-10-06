import { Download, MapPin, Printer, Ticket, X } from 'lucide-react'
import type { Attraction, TicketType } from '../types'
import { dateOnly } from '../utils/format'

type Props = {
  bookingCode: string
  bookingId: number
  attraction: Attraction
  ticket: TicketType
  visitDate: string | null
  quantity: number
  customerName: string
  onClose: () => void
}

function reference(bookingId: number, index: number) {
  return `TKV-ATT-${String(bookingId).padStart(8, '0')}-${String(index + 1).padStart(2, '0')}`
}

export default function AttractionTickets({ bookingCode, bookingId, attraction, ticket, visitDate, quantity, customerName, onClose }: Props) {
  const count = Math.max(1, Number(quantity) || 1)
  const printTicket = () => window.print()

  return <div className="flight-ticket-overlay attraction-ticket-overlay" role="presentation" onMouseDown={onClose}>
    <div className="flight-ticket-dialog attraction-ticket-dialog" role="dialog" aria-modal="true" aria-label="Vé tham quan điện tử" onMouseDown={e => e.stopPropagation()}>
      <header className="flight-ticket-dialog-head"><div><h2>Vé tham quan điện tử</h2><p>Đơn {bookingCode} · {count} vé</p></div><button type="button" aria-label="Đóng" onClick={onClose}><X/></button></header>
      <div className="attraction-ticket-dialog-body">
        <div className="flight-ticket-main">
          <div className="flight-ticket-print-area attraction-ticket-print-area">
            <div className="flight-ticket-banner attraction-ticket-banner"><div><Ticket/><strong>TAKIVIVU</strong></div><span>VÉ THAM QUAN / E-TICKET</span><b>{ticket.tenLoaiVe}</b></div>
            <div className="flight-ticket-paper">
              <div className="flight-ticket-identity"><div><small>Khách hàng</small><strong>{customerName || '—'}</strong></div><div><small>Mã đặt dịch vụ</small><strong>{bookingCode}</strong></div></div>
              <div className="attraction-ticket-place"><small>Địa điểm tham quan</small><strong>{attraction.tenDiaDiem}</strong><span><MapPin/>{[attraction.diaChi, attraction.quanHuyen, attraction.thanhPho].filter(Boolean).join(', ')}</span></div>
              <div className="flight-ticket-facts"><div><small>Ngày tham quan</small><b>{dateOnly(visitDate)}</b></div><div><small>Loại vé</small><b>{ticket.tenLoaiVe}</b></div><div><small>Đối tượng áp dụng</small><b>{ticket.doiTuongApDung || '—'}</b></div><div><small>Số lượng</small><b>{count} vé</b></div></div>
              <div className="flight-ticket-facts"><div><small>Giờ hoạt động</small><b>{attraction.gioMoCua} - {attraction.gioDongCua}</b></div><div className="flight-ticket-reference"><small>Mã vé TAKIVIVU</small><b>{count === 1 ? reference(bookingId, 0) : `${reference(bookingId, 0)} → ${reference(bookingId, count - 1)}`}</b></div></div>
              {count > 1 && <div className="attraction-ticket-codes"><small>Danh sách mã vé</small><div>{Array.from({ length: count }, (_, index) => <span key={index}><b>{index + 1}</b>{reference(bookingId, index)}</span>)}</div></div>}
              <div className="flight-ticket-disclaimer"><Ticket/> Đây là vé/xác nhận đặt dịch vụ do TAKIVIVU phát hành cho đơn đã được xác nhận. Vui lòng xuất trình mã vé cùng giấy tờ cần thiết tại điểm tham quan.</div>
            </div>
          </div>
          <div className="flight-ticket-actions"><button type="button" onClick={onClose}>Đóng</button><button type="button" onClick={printTicket}><Printer/> In vé</button><button type="button" className="primary" onClick={printTicket}><Download/> Lưu PDF</button></div>
          <p className="flight-ticket-save-help">Để lưu PDF, chọn “Save as PDF / Lưu dưới dạng PDF” trong hộp thoại in.</p>
        </div>
      </div>
    </div>
  </div>
}
