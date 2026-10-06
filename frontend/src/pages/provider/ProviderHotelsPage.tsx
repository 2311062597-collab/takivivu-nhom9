import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  Hotel as HotelIcon,
  MapPin,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hotelApi } from '../../api/services'
import type { Hotel, HotelStatus } from '../../types'
import { apiError } from '../../utils/format'
import { EmptyState, ErrorState, Loading } from '../../components/UI'

const PER_PAGE = 6

type FilterValue = '' | HotelStatus

function statusText(status: HotelStatus) {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'
}

function cityLabel(hotel: Hotel) {
  return hotel.thanhPho || hotel.diaChi || 'Chưa cập nhật'
}

function roomCount(hotel: Hotel) {
  return hotel.danhSachPhong?.reduce((sum, room) => sum + (room.tongSoPhong || 0), 0) || 0
}

function HotelThumb({ hotel, index }: { hotel: Hotel; index: number }) {
  const variant = (hotel.id + index) % 6
  return (
    <div className={`provider-hotel-thumb hotel-thumb-${variant}`} aria-hidden="true">
      <span className="hotel-thumb-sky" />
      <span className="hotel-thumb-building"><i/><i/><i/><i/><i/></span>
      <span className="hotel-thumb-ground" />
    </div>
  )
}

export default function ProviderHotelsPage() {
  const navigate = useNavigate()
  const filterRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<FilterValue>('')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [remove, setRemove] = useState<Hotel | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    hotelApi.mine().then(setData).catch(e => setError(apiError(e))).finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const shown = useMemo(() => data.filter(h => {
    const text = `${h.tenKhachSan} ${h.thanhPho} ${h.diaChi}`.toLowerCase()
    return (!q || text.includes(q.toLowerCase())) && (!status || h.trangThai === status)
  }), [data, q, status])

  useEffect(() => setPage(1), [q, status])

  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const currentPage = Math.min(page, pages)
  const paged = shown.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const del = async () => {
    if (!remove) return
    setBusy(true)
    setError('')
    try {
      await hotelApi.remove(remove.id)
      setRemove(null)
      load()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="provider-hotels-v2">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><span>Quản lý khách sạn</span><span>›</span><strong>Danh sách khách sạn</strong></div>

      <section className="provider-hotel-list-heading">
        <div>
          <h1>Danh sách khách sạn</h1>
          <p>Quản lý thông tin các khách sạn của bạn.</p>
        </div>
        <div className="provider-hotel-list-tools">
          <div className="provider-hotel-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm theo tên khách sạn, địa điểm..."/></div>
          <div className="provider-hotel-filter-wrap" ref={filterRef}>
            <button className={`provider-hotel-filter ${status ? 'has-filter' : ''}`} onClick={()=>setFilterOpen(v=>!v)}><Filter/> Bộ lọc</button>
            {filterOpen && <div className="provider-hotel-filter-menu">
              <button className={!status?'active':''} onClick={()=>{setStatus('');setFilterOpen(false)}}>Tất cả trạng thái</button>
              <button className={status==='ACTIVE'?'active':''} onClick={()=>{setStatus('ACTIVE');setFilterOpen(false)}}>Hoạt động</button>
              <button className={status==='INACTIVE'?'active':''} onClick={()=>{setStatus('INACTIVE');setFilterOpen(false)}}>Tạm dừng</button>
            </div>}
          </div>
          <button className="provider-hotel-add-mobile" onClick={()=>navigate('/provider/hotels/new')}><Plus/> Thêm khách sạn</button>
        </div>
      </section>

      {error && <div className="hotel-inline-error">{error}</div>}

      <section className="provider-hotel-table-card">
        {loading ? <Loading label="Đang tải danh sách khách sạn..."/> : error && !data.length ? <ErrorState message={error} onRetry={load}/> : shown.length === 0 ? <EmptyState title="Không tìm thấy khách sạn"/> : (
          <div className="provider-hotel-table-wrap">
            <table className="provider-hotel-table">
              <thead><tr><th>Tên khách sạn</th><th>Địa điểm</th><th>Số sao</th><th>Số phòng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{paged.map((h,index)=><tr key={h.id}>
                <td>
                  <div className="provider-hotel-name-cell"><HotelThumb hotel={h} index={index}/><div><strong>{h.tenKhachSan}</strong><small>{cityLabel(h)}</small></div></div>
                </td>
                <td><div className="provider-hotel-location"><MapPin/>{cityLabel(h)}</div></td>
                <td><div className="provider-hotel-stars" aria-label={`${h.soSao || 0} sao`}>{Array.from({length:5},(_,i)=><Star key={i} className={i<(h.soSao||0)?'filled':''}/>)}</div></td>
                <td className="provider-hotel-room-count">{roomCount(h)}</td>
                <td><span className={`provider-hotel-status ${h.trangThai==='ACTIVE'?'active':'paused'}`}>{statusText(h.trangThai)}</span></td>
                <td><div className="provider-hotel-actions">
                  <button title="Xem" onClick={()=>navigate(`/hotels/${h.id}`)}><Eye/></button>
                  <button title="Sửa" onClick={()=>navigate(`/provider/hotels/${h.id}/edit`)}><Edit3/></button>
                  <button title="Xóa" className="delete" onClick={()=>setRemove(h)}><Trash2/></button>
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}

        <div className="provider-hotel-pagination">
          <span>Hiển thị {shown.length ? (currentPage-1)*PER_PAGE+1 : 0} - {Math.min(currentPage*PER_PAGE,shown.length)} của {shown.length} khách sạn</span>
          <div>
            <button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft/></button>
            {Array.from({length:pages},(_,i)=>i+1).slice(0,5).map(p=><button key={p} className={p===currentPage?'active':''} onClick={()=>setPage(p)}>{p}</button>)}
            <button disabled={currentPage===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}><ChevronRight/></button>
          </div>
        </div>
      </section>

      {remove && <div className="hotel-delete-backdrop" onMouseDown={()=>!busy&&setRemove(null)}>
        <div className="hotel-delete-modal" onMouseDown={e=>e.stopPropagation()}>
          <button className="hotel-delete-close" disabled={busy} onClick={()=>setRemove(null)}><X/></button>
          <span className="hotel-delete-icon"><Trash2/></span>
          <h3>Xóa khách sạn</h3>
          <p>Bạn có chắc chắn muốn xóa khách sạn<br/><strong>“{remove.tenKhachSan}”?</strong></p>
          <small>Hành động này không thể hoàn tác.</small>
          <div className="hotel-delete-actions"><button className="cancel" disabled={busy} onClick={()=>setRemove(null)}>Hủy</button><button className="confirm" disabled={busy} onClick={()=>void del()}><Trash2/>{busy?'Đang xóa...':'Xóa khách sạn'}</button></div>
        </div>
      </div>}
    </div>
  )
}
