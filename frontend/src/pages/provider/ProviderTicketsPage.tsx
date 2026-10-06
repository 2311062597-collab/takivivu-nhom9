import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { attractionApi } from '../../api/services'
import type { Attraction, AttractionTicketCategory, TicketType } from '../../types'
import { EmptyState, ErrorState, Loading } from '../../components/UI'
import { apiError, money } from '../../utils/format'
import { loadAttractionExtra } from './ProviderAttractionsPage'

const PER_PAGE = 6

export interface TicketExtra {
  kind: string
  audience: string
  usageWindow: string
  terms: string
  images: string[]
}

export function loadTicketExtra(ticket: TicketType, attraction?: Attraction): TicketExtra {
  const attractionExtra = attraction ? loadAttractionExtra(attraction) : null
  return {
    kind: ticket.tenLoaiVe,
    audience: ticket.doiTuongApDung,
    usageWindow: attraction ? `Trong ngày (${attraction.gioMoCua || '08:00'} - ${attraction.gioDongCua || '22:00'})` : 'Trong ngày',
    terms: [
      `Áp dụng cho ${ticket.doiTuongApDung.toLowerCase()}.`,
      'Vé có giá trị theo ngày hiệu lực và khung giờ hoạt động của địa điểm.',
      'Điều kiện hủy/hoàn vé áp dụng theo đơn đặt dịch vụ.',
    ].join('\n'),
    images: attractionExtra?.images?.length ? attractionExtra.images.slice(0, 5) : attraction?.hinhAnh ? [attraction.hinhAnh] : [],
  }
}

function statusLabel(status: TicketType['trangThai']) {
  return status === 'AVAILABLE' ? 'Đang bán' : 'Tạm dừng'
}

function kindClass(code: string) {
  if (code === 'CHILD') return 'green'
  if (code === 'SENIOR') return 'purple'
  return 'blue'
}

function TicketThumb({ ticket, attraction }: { ticket: TicketType; attraction?: Attraction }) {
  const extra = loadTicketExtra(ticket, attraction)
  const source = extra.images[0] || attraction?.hinhAnh || ''
  const [failed, setFailed] = useState(false)
  if (source && !failed) return <img className="ticket-table-thumb" src={source} alt="" onError={() => setFailed(true)} />
  return <div className="ticket-table-thumb ticket-thumb-fallback"><span/><i/><b/></div>
}

export default function ProviderTicketsPage() {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<Attraction[]>([])
  const [categories, setCategories] = useState<AttractionTicketCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [remove, setRemove] = useState<{ ticket: TicketType; attraction: Attraction } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([attractionApi.mine(), attractionApi.ticketCategories()])
      .then(([mine, ticketCategories]) => { setPlaces(mine); setCategories(ticketCategories) })
      .catch(e => setError(apiError(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const rows = useMemo(() => places.flatMap(attraction => (attraction.danhSachLoaiVe || []).map(ticket => ({ attraction, ticket }))), [places])
  const shown = useMemo(() => rows.filter(({ attraction, ticket }) => {
    const text = `${ticket.tenLoaiVe} ${ticket.doiTuongApDung} ${ticket.moTa} ${attraction.tenDiaDiem}`.toLowerCase()
    return (!placeId || attraction.id === Number(placeId)) && (!kind || ticket.maLoaiVe === kind) && (!status || ticket.trangThai === status) && (!query || text.includes(query.toLowerCase()))
  }), [rows, placeId, kind, status, query])

  useEffect(() => setPage(1), [placeId, kind, status, query])
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const currentPage = Math.min(page, pages)
  const paged = shown.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const del = async () => {
    if (!remove) return
    setBusy(true)
    setError('')
    try {
      await attractionApi.removeTicket(remove.attraction.id, remove.ticket.id)
      setRemove(null)
      load()
    } catch (e) {
      setError(apiError(e))
      setRemove(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="provider-tickets-v2">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><span>Quản lý vé</span><span>›</span><strong>Danh sách vé</strong></div>

      <section className="ticket-list-heading">
        <div><h1>Danh sách vé</h1><p>Quản lý các loại vé tham quan tại các địa điểm bạn cung cấp.</p></div>
        <button className="ticket-primary" onClick={() => navigate('/provider/tickets/new')}><Plus/> Thêm loại vé</button>
      </section>

      {error && <div className="hotel-inline-error">{error}</div>}

      <section className="ticket-list-card">
        <div className="ticket-filter-row">
          <label><span>Địa điểm tham quan</span><select value={placeId} onChange={e => setPlaceId(e.target.value)}><option value="">Tất cả</option>{places.map(place => <option key={place.id} value={place.id}>{place.tenDiaDiem}</option>)}</select></label>
          <label><span>Loại vé</span><select value={kind} onChange={e => setKind(e.target.value)}><option value="">Tất cả</option>{categories.map(item => <option key={item.maLoaiVe} value={item.maLoaiVe}>{item.tenLoaiVe}</option>)}</select></label>
          <label><span>Trạng thái</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option value="AVAILABLE">Đang bán</option><option value="UNAVAILABLE">Tạm dừng</option></select></label>
          <div className="ticket-search"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm theo tên vé..."/></div>
          <button className="ticket-filter-button"><Filter/> Bộ lọc</button>
        </div>

        {loading ? <Loading label="Đang tải danh sách vé..."/> : error && !places.length ? <ErrorState message={error} onRetry={load}/> : shown.length === 0 ? <EmptyState title="Chưa có loại vé phù hợp"/> : (
          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead><tr><th>STT</th><th>Tên vé</th><th>Địa điểm tham quan</th><th>Loại vé</th><th>Giá (VND)</th><th>Số lượng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{paged.map(({ attraction, ticket }, index) => {
                const extra = loadTicketExtra(ticket, attraction)
                return <tr key={`${attraction.id}-${ticket.id}`}>
                  <td>{(currentPage - 1) * PER_PAGE + index + 1}</td>
                  <td><div className="ticket-name-cell"><TicketThumb ticket={ticket} attraction={attraction}/><div><strong>{ticket.tenLoaiVe}</strong><small>{ticket.doiTuongApDung}</small></div></div></td>
                  <td><strong className="ticket-place-name">{attraction.tenDiaDiem}</strong></td>
                  <td><span className={`ticket-kind ${kindClass(ticket.maLoaiVe)}`}>{ticket.tenLoaiVe}</span></td>
                  <td><strong>{money(ticket.giaVe).replace(' ₫','')}</strong></td>
                  <td>{ticket.tongSoVe.toLocaleString('vi-VN')}</td>
                  <td><span className={`ticket-status ${ticket.trangThai === 'AVAILABLE' ? 'selling' : 'paused'}`}>{statusLabel(ticket.trangThai)}</span></td>
                  <td><div className="ticket-row-actions"><button title="Xem chi tiết" onClick={() => navigate(`/provider/tickets/${ticket.id}`)}><Eye/></button><button title="Sửa" onClick={() => navigate(`/provider/tickets/${ticket.id}/edit`)}><Edit3/></button><button className="danger" title="Xóa" onClick={() => setRemove({ ticket, attraction })}><Trash2/></button></div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}

        <div className="ticket-pagination"><span>Hiển thị {shown.length ? (currentPage - 1) * PER_PAGE + 1 : 0} - {Math.min(currentPage * PER_PAGE, shown.length)} của {shown.length} vé</span><div><button disabled={currentPage <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft/></button>{Array.from({ length: pages }, (_, index) => index + 1).slice(0, 4).map(item => <button key={item} className={currentPage === item ? 'active' : ''} onClick={() => setPage(item)}>{item}</button>)}<button disabled={currentPage >= pages} onClick={() => setPage(value => Math.min(pages, value + 1))}><ChevronRight/></button></div></div>
      </section>

      {remove && <div className="ticket-modal-backdrop" onMouseDown={() => !busy && setRemove(null)}><div className="ticket-delete-modal" onMouseDown={e => e.stopPropagation()}><button className="ticket-modal-close" onClick={() => setRemove(null)}><X/></button><span className="ticket-delete-icon"><Trash2/></span><h3>Xóa vé</h3><p>Bạn có chắc chắn muốn xóa vé <strong>“{remove.ticket.tenLoaiVe}”?</strong></p><small>Hành động này không thể hoàn tác.<br/>Tất cả dữ liệu liên quan đến vé này sẽ bị xóa khỏi hệ thống.</small><div className="ticket-delete-warning"><span>!</span><strong>Lưu ý: Không thể xóa vé nếu đang có đơn đặt dịch vụ sử dụng vé này.</strong></div><div className="ticket-delete-actions"><button onClick={() => setRemove(null)}>Hủy</button><button className="danger" disabled={busy} onClick={() => void del()}><Trash2/>{busy ? 'Đang xóa...' : 'Xóa vé'}</button></div></div></div>}
    </div>
  )
}
