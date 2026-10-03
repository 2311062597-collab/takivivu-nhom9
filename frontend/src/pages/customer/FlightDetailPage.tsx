import { ArrowLeft, ArrowRight, BaggageClaim, CalendarDays, CheckCircle2, Clock3, Plane, ShieldCheck, TicketCheck, Wifi } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { flightApi } from '../../api/services'
import type { Flight, FlightInventory } from '../../types'
import { apiError, dateTime, money } from '../../utils/format'
import { Badge, ErrorState, Loading } from '../../components/UI'

function hm(value: string) { return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
function date(value: string) { return new Date(value).toLocaleDateString('vi-VN') }
function duration(start: string, end: string) { const m = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)); return `${Math.floor(m / 60)}h ${m % 60}m` }

export default function FlightDetailPage() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const passengers = Math.max(1, Number(sp.get('passengers') || 1))
  const [flight, setFlight] = useState<Flight | null>(null)
  const [inventory, setInventory] = useState<FlightInventory | null>(null)
  const [related, setRelated] = useState<Flight[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [infoTab, setInfoTab] = useState<'detail' | 'rules' | 'airport'>('detail')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    flightApi.detail(Number(id)).then(async data => {
      setFlight(data)
      flightApi.inventory(data.id).then(setInventory).catch(() => setInventory(null))
      try {
        const more = await flightApi.search({ diemDi: data.diemDi, diemDen: data.diemDen, ngayKhoiHanh: data.thoiGianKhoiHanh.slice(0, 10) })
        setRelated(more.filter(item => item.id !== data.id && item.trangThai === 'SCHEDULED').slice(0, 3))
      } catch { setRelated([]) }
    }).catch(e => setError(apiError(e))).finally(() => setLoading(false))
  }, [id])

  const disabled = useMemo(() => !flight || flight.trangThai !== 'SCHEDULED' || flight.soGheConLai < passengers, [flight, passengers])
  if (loading) return <div className="container pad"><Loading/></div>
  if (error || !flight) return <div className="container pad"><ErrorState message={error || 'Không tìm thấy chuyến bay.'}/></div>

  return <div className="flight-detail-ref-page">
    <section className="flight-detail-ref-hero"><div className="container"><div className="flight-ref-breadcrumb">Trang chủ <span>›</span> Chuyến bay <span>›</span> Chi tiết</div><h1>Chi tiết chuyến bay</h1><p>Kiểm tra thông tin chi tiết và chọn hạng vé phù hợp.</p><div className="flight-detail-script">Hơn cả một chuyến bay<br/>Là những trải nghiệm mới <Plane/></div></div></section>
    <div className="container flight-detail-ref-grid">
      <main>
        <section className="flight-main-summary card">
          <div className="flight-main-airline"><span className="airline-badge default"><Plane/></span><div><strong>{flight.hangHangKhong}</strong><small>{flight.maChuyenBay}</small></div></div>
          <div className="flight-main-route"><div><strong>{hm(flight.thoiGianKhoiHanh)}</strong><b>{flight.sanBayDi}</b><small>{flight.diemDi}</small></div><div className="route-middle"><span>{duration(flight.thoiGianKhoiHanh, flight.thoiGianDen)}</span><div><i/><Plane/><i/></div><small>Bay thẳng</small></div><div><strong>{hm(flight.thoiGianDen)}</strong><b>{flight.sanBayDen}</b><small>{flight.diemDen}</small></div></div>
          <Badge tone={flight.trangThai === 'SCHEDULED' ? 'green' : 'gray'}>{flight.trangThai === 'SCHEDULED' ? 'Đang mở bán' : flight.trangThai}</Badge>
        </section>

        <section className="flight-benefit-row">
          <article><BaggageClaim/><div><strong>Hành lý xách tay</strong><span>Theo chính sách hãng bay</span></div></article>
          <article><TicketCheck/><div><strong>Hành lý ký gửi</strong><span>Phụ thuộc hạng vé của nhà cung cấp</span></div></article>
          <article><ShieldCheck/><div><strong>Suất ăn</strong><span>Theo cấu hình của hãng</span></div></article>
          <article><Wifi/><div><strong>Tiện ích</strong><span>Thông tin bổ sung khi làm thủ tục</span></div></article>
        </section>

        <section className="flight-fares"><div className="section-inline-title"><h2>Các hạng vé của chuyến bay</h2><span>Số ghế còn lại: <b>{flight.soGheConLai}</b></span></div><div className="fare-grid">
          {(inventory?.fares?.length ? inventory.fares : [{id:0,hangVe:flight.hangVe||'Phổ thông',giaVe:flight.giaVe,soGhe:flight.tongSoGhe,soGheConLai:flight.soGheConLai}]).map(fare=><Link className={`fare-card fare-card-clickable${disabled || fare.soGheConLai < passengers ? ' unavailable' : ''}`} key={fare.id} to={disabled || fare.soGheConLai < passengers ? '#' : `/flights/${flight.id}/seats?fare=${encodeURIComponent(fare.hangVe)}`} onClick={e => (disabled || fare.soGheConLai < passengers) && e.preventDefault()} aria-label={`Xem sơ đồ ghế hạng ${fare.hangVe}`}><div className="fare-name"><strong>{fare.hangVe}</strong><span>{fare.soGheConLai >= passengers ? 'Còn vé' : 'Hết vé'}</span></div><div className="fare-price"><strong>{money(fare.giaVe)}</strong><small>/ người</small></div><p>Còn {fare.soGheConLai}/{fare.soGhe} ghế</p><span className="fare-card-hint">{fare.soGheConLai >= passengers ? 'Nhấn vào thẻ để xem ghế' : 'Không đủ ghế trống'}</span></Link>)}
        </div></section>



        {related.length > 0 && <section className="flight-related"><div className="section-inline-title"><h2>Các chuyến bay khác cùng hành trình</h2></div><div className="flight-related-grid">{related.map(item => <Link key={item.id} to={`/flights/${item.id}?passengers=${passengers}`}><strong>{item.hangHangKhong}</strong><span>{hm(item.thoiGianKhoiHanh)} → {hm(item.thoiGianDen)}</span><b>{money(item.giaVe)}</b></Link>)}</div></section>}
      </main>

      <aside>
        <section className="card flight-order-summary"><div className="summary-title"><h3>Thông tin đặt vé</h3><Link to={`/flights?diemDi=${encodeURIComponent(flight.diemDi)}&diemDen=${encodeURIComponent(flight.diemDen)}&ngayKhoiHanh=${flight.thoiGianKhoiHanh.slice(0,10)}&passengers=${passengers}`}>Thay đổi</Link></div><div className="summary-route"><div><strong>{flight.sanBayDi}</strong><span>{flight.diemDi}</span></div><Plane/><div><strong>{flight.sanBayDen}</strong><span>{flight.diemDen}</span></div></div><p><CalendarDays/> {dateTime(flight.thoiGianKhoiHanh)}</p><p className="flight-summary-seat-note">Số vé và giá tiền sẽ được xác định sau khi bạn chọn ghế trên sơ đồ.</p>{disabled ? <button className="btn btn-block" disabled>Không thể đặt chuyến này</button> : <Link className="btn btn-block" to={`/flights/${flight.id}/seats`}>Xem sơ đồ ghế <ArrowRight/></Link>}<small>Chọn ghế để xem giá theo từng hạng và tổng tiền ở bước tiếp theo.</small></section>
        <section className="flight-side-promo"><div><strong>Trải nghiệm hành trình thoải mái hơn</strong><p>Chỉ hiển thị dịch vụ thực tế được backend hỗ trợ trong bước đặt vé.</p><Link to="/promotions">Xem ưu đãi đã đăng</Link></div></section>
      </aside>
        <section className="card flight-info-tabs flight-info-full-width"><div className="flight-info-tabbar"><button type="button" className={infoTab === 'detail' ? 'active' : ''} onClick={() => setInfoTab('detail')}>Thông tin chi tiết</button><button type="button" className={infoTab === 'rules' ? 'active' : ''} onClick={() => setInfoTab('rules')}>Điều kiện vé</button><button type="button" className={infoTab === 'airport' ? 'active' : ''} onClick={() => setInfoTab('airport')}>Thông tin sân bay</button></div>{infoTab === 'detail' && <div className="flight-info-columns"><div><p><span>Hãng hàng không</span><strong>{flight.hangHangKhong}</strong></p><p><span>Mã chuyến bay</span><strong>{flight.maChuyenBay}</strong></p><p><span>Ngày bay</span><strong>{date(flight.thoiGianKhoiHanh)}</strong></p><p><span>Sân bay đi</span><strong>{flight.sanBayDi}</strong></p><p><span>Sân bay đến</span><strong>{flight.sanBayDen}</strong></p></div><div className="flight-timeline"><div><i/><strong>{hm(flight.thoiGianKhoiHanh)}</strong><span>{flight.diemDi}</span></div><small>{duration(flight.thoiGianKhoiHanh, flight.thoiGianDen)} · Bay thẳng</small><div><i/><strong>{hm(flight.thoiGianDen)}</strong><span>{flight.diemDen}</span></div></div></div>}{infoTab === 'rules' && <div className="flight-tab-content"><h3>Điều kiện vé</h3><p>Vé chỉ được xác nhận khi Booking Service tạo đơn thành công và còn đủ ghế. Giá cuối cùng được kiểm tra lại tại thời điểm đặt vé.</p><p>Điều kiện đổi, hoàn, hành lý và các quyền lợi khác áp dụng theo chính sách của hãng hàng không/nhà cung cấp đối với hạng vé đang bán.</p></div>}{infoTab === 'airport' && <div className="flight-tab-content"><h3>Thông tin sân bay</h3><p><strong>Sân bay đi:</strong> {flight.sanBayDi} — {flight.diemDi}</p><p><strong>Sân bay đến:</strong> {flight.sanBayDen} — {flight.diemDen}</p><p>Hành khách nên có mặt sớm để hoàn tất thủ tục check-in và kiểm tra giấy tờ trước giờ khởi hành.</p></div>}</section>
    </div>
    <div className="container"><Link className="flight-back-link" to="/flights"><ArrowLeft/>Quay lại danh sách chuyến bay</Link></div>
  </div>
}

function UsersRoundIcon(){ return <span className="summary-person-icon">◉</span> }
