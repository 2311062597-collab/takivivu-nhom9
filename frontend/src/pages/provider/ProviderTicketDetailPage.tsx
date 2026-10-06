import { GoogleMapFrame } from '../../components/GoogleMap'
import {
  BarChart3,
  ChevronLeft,
  Edit3,
  ExternalLink,
  MapPin,
  Pause,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { attractionApi } from '../../api/services'
import type { Attraction, TicketType } from '../../types'
import { Loading } from '../../components/UI'
import { apiError, dateOnly, money } from '../../utils/format'
import { loadAttractionExtra } from './ProviderAttractionsPage'
import { loadTicketExtra } from './ProviderTicketsPage'
import { googleMapEmbed, googleMapExternal } from '../../utils/googleMaps'

export default function ProviderTicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<TicketType | null>(null)
  const [place, setPlace] = useState<Attraction | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removeOpen, setRemoveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const [current, mine] = await Promise.all([attractionApi.ticket(Number(id)), attractionApi.mine()])
        if (!alive) return
        setTicket(current)
        setPlace(mine.find(item => item.id === current.diaDiemId))
      } catch (e) {
        if (alive) setError(apiError(e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [id])

  const extra = useMemo(() => ticket ? loadTicketExtra(ticket, place) : null, [ticket, place])
  const placeExtra = useMemo(() => place ? loadAttractionExtra(place) : null, [place])
  const images = extra?.images?.length ? extra.images : placeExtra?.images || []
  const hero = images[imageIndex] || images[0] || place?.hinhAnh || ''

  const remove = async () => {
    if (!ticket || !place) return
    setBusy(true)
    setError('')
    try {
      await attractionApi.removeTicket(place.id, ticket.id)
      navigate('/provider/tickets')
    } catch (e) {
      setError(apiError(e))
      setRemoveOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Đang tải chi tiết vé..."/>
  if (!ticket || !extra) return <div className="hotel-form-error">{error || 'Không tìm thấy vé.'}</div>

  const sold = Math.max(0, ticket.tongSoVe - ticket.soVeConLai)

  return (
    <div className="ticket-detail-page">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/tickets">Quản lý vé</Link><span>›</span><Link to="/provider/tickets">Danh sách vé</Link><span>›</span><strong>Chi tiết vé</strong></div>
      <button className="ticket-detail-back" onClick={() => navigate('/provider/tickets')}><ChevronLeft/> Quay lại danh sách vé</button>
      <div className="ticket-detail-title"><h1>Chi tiết vé</h1><div><button className="ticket-outline" onClick={() => navigate(`/provider/tickets/${ticket.id}/edit`)}><Edit3/> Sửa vé</button><button className="ticket-danger-outline" onClick={() => setRemoveOpen(true)}><Trash2/> Xóa vé</button></div></div>
      {error && <div className="hotel-inline-error">{error}</div>}

      <div className="ticket-detail-grid">
        <section className="ticket-detail-main">
          <div className="ticket-detail-top-card">
            <div className="ticket-detail-gallery">
              <div className="ticket-detail-hero">{hero ? <img src={hero} alt=""/> : <div className="ticket-hero-fallback"><span/><i/><b/></div>}{images.length > 1 && <><button className="prev" onClick={() => setImageIndex(value => (value - 1 + images.length) % images.length)}>‹</button><button className="next" onClick={() => setImageIndex(value => (value + 1) % images.length)}>›</button></>}</div>
              <div className="ticket-detail-thumbs">{images.slice(0, 4).map((src,index)=><button className={imageIndex === index ? 'active' : ''} key={`${src.slice(0,20)}-${index}`} onClick={()=>setImageIndex(index)}><img src={src} alt=""/></button>)}{images.length > 4 && <button onClick={()=>setImageIndex(4)}><img src={images[4]} alt=""/><span>+{images.length - 4}</span></button>}</div>
            </div>
            <div className="ticket-detail-summary">
              <div className="ticket-detail-name"><h2>{ticket.tenLoaiVe}</h2><span>{extra.kind}</span></div>
              <p>{extra.audience}</p>
              <dl><div><dt>Địa điểm tham quan</dt><dd>{place?.tenDiaDiem || '—'}</dd></div><div><dt>Loại vé</dt><dd>{extra.kind}</dd></div><div><dt>Giá vé</dt><dd className="price">{money(ticket.giaVe)}</dd></div><div><dt>Số lượng</dt><dd>{ticket.tongSoVe.toLocaleString('vi-VN')} vé</dd></div><div><dt>Đã bán</dt><dd>{sold.toLocaleString('vi-VN')} vé</dd></div><div><dt>Còn lại</dt><dd>{ticket.soVeConLai.toLocaleString('vi-VN')} vé</dd></div><div><dt>Thời hạn sử dụng</dt><dd>{extra.usageWindow}</dd></div><div><dt>Ngày hiệu lực</dt><dd>{dateOnly(ticket.ngayBatDau)} - {dateOnly(ticket.ngayKetThuc)}</dd></div></dl>
            </div>
          </div>

          <div className="ticket-detail-description"><h3>Mô tả</h3><p>{ticket.moTa || 'Chưa có mô tả.'}</p><h3>Điều kiện sử dụng</h3><ul>{extra.terms.split('\n').filter(Boolean).map(line => <li key={line}>{line.replace(/^[-•]\s*/, '')}</li>)}</ul></div>
        </section>

        <aside className="ticket-detail-side">
          <section className="ticket-status-card"><h3>Trạng thái</h3><div className={ticket.trangThai === 'AVAILABLE' ? 'selling' : 'paused'}><span>●</span>{ticket.trangThai === 'AVAILABLE' ? 'Đang bán' : 'Tạm dừng'}</div><p>Vé đang hiển thị trên hệ thống và có thể đặt.</p><button><Pause/> Tạm dừng bán</button></section>
          <section className="ticket-quick-card"><h3>Liên kết nhanh</h3><button><ExternalLink/> Xem trên trang khách hàng <b>↗</b></button><button><Edit3/> Sao chép liên kết <b>⧉</b></button><button><BarChart3/> Xem thống kê đặt vé <b>›</b></button></section>
          {place && <section className="ticket-place-card"><h3>Thông tin địa điểm</h3><div><div className="ticket-place-thumb">{placeExtra?.images?.[0] || place.hinhAnh ? <img src={placeExtra?.images?.[0] || place.hinhAnh || ''} alt=""/> : <span/>}</div><div><strong>{place.tenDiaDiem}</strong><small><MapPin/> {place.diaChi}</small><button onClick={()=>navigate(`/provider/attractions/${place.id}`)}>Xem chi tiết địa điểm</button></div></div></section>}
          {place && <section className="ticket-map-card"><h3>Vị trí trên bản đồ</h3><GoogleMapFrame title="Bản đồ địa điểm" src={googleMapEmbed(place.viDo, place.kinhDo, [place.diaChi, place.quanHuyen, place.thanhPho].filter(Boolean).join(', '))}/><a target="_blank" rel="noreferrer" href={googleMapExternal(place.viDo, place.kinhDo, [place.diaChi, place.quanHuyen, place.thanhPho].filter(Boolean).join(', '))}>Xem trên Google Maps <ExternalLink/></a></section>}
        </aside>
      </div>

      {removeOpen && <div className="ticket-modal-backdrop" onMouseDown={()=>!busy&&setRemoveOpen(false)}><div className="ticket-delete-modal" onMouseDown={e=>e.stopPropagation()}><button className="ticket-modal-close" onClick={()=>setRemoveOpen(false)}>×</button><span className="ticket-delete-icon"><Trash2/></span><h3>Xóa vé</h3><p>Bạn có chắc chắn muốn xóa vé <strong>“{ticket.tenLoaiVe}”?</strong></p><small>Hành động này không thể hoàn tác.<br/>Tất cả dữ liệu liên quan đến vé này sẽ bị xóa khỏi hệ thống.</small><div className="ticket-delete-warning"><span>!</span><strong>Lưu ý: Không thể xóa vé nếu đang có đơn đặt dịch vụ sử dụng vé này.</strong></div><div className="ticket-delete-actions"><button onClick={()=>setRemoveOpen(false)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void remove()}><Trash2/>{busy?'Đang xóa...':'Xóa vé'}</button></div></div></div>}
    </div>
  )
}
