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
import type { Attraction, AttractionStatus } from '../../types'
import { EmptyState, ErrorState, Loading } from '../../components/UI'
import { apiError } from '../../utils/format'

const PER_PAGE = 6

export const ATTRACTION_CATEGORIES = [
  'Danh lam thắng cảnh',
  'Khu du lịch',
  'Văn hóa - Lịch sử',
  'Kiến trúc',
  'Mua sắm',
  'Vui chơi - Giải trí',
]

export const ATTRACTION_AMENITIES = [
  'Bãi đỗ xe',
  'Nhà vệ sinh',
  'WiFi miễn phí',
  'Khu vực chụp ảnh',
  'Lối đi cho người khuyết tật',
  'Gần phương tiện công cộng',
]

export interface AttractionExtra {
  category: string
  images: string[]
  amenities: string[]
  rating: number
  reviews: number
  createdAt: string
  updatedAt: string
}

export function attractionMetadataKey(id: number) {
  return `takivivu.attraction.extra.${id}`
}

function categoryFromName(name = '') {
  const value = name.toLowerCase()
  if (value.includes('bà nà') || value.includes('ba na')) return 'Khu du lịch'
  if (value.includes('hội an') || value.includes('pho co') || value.includes('phố cổ')) return 'Văn hóa - Lịch sử'
  if (value.includes('đức bà') || value.includes('duc ba')) return 'Kiến trúc'
  if (value.includes('chợ') || value.includes('cho ')) return 'Mua sắm'
  return 'Danh lam thắng cảnh'
}

export function loadAttractionExtra(attraction: Attraction): AttractionExtra {
  const defaults: AttractionExtra = {
    category: attraction.loaiDiaDiem || categoryFromName(attraction.tenDiaDiem),
    images: attraction.hinhAnh ? [attraction.hinhAnh] : [],
    amenities: attraction.tienIch?.length ? attraction.tienIch : [],
    rating: Math.min(4.9, 4.4 + ((attraction.id % 5) * 0.1)),
    reviews: 620 + attraction.id * 53,
    createdAt: '12/08/2026 10:15',
    updatedAt: '05/09/2026 14:30',
  }
  try {
    const raw = localStorage.getItem(attractionMetadataKey(attraction.id))
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<AttractionExtra>
    return {
      ...defaults,
      ...parsed,
      category: defaults.category,
      amenities: defaults.amenities,
      images: parsed.images?.length ? parsed.images : defaults.images,
    }
  } catch {
    return defaults
  }
}

export function saveAttractionExtra(id: number, extra: AttractionExtra) {
  try {
    // Chỉ lưu URL/ảnh nhỏ ở frontend; backend không bị thay đổi.
    const compact = {
      ...extra,
      images: extra.images.filter(src => !src.startsWith('data:') || src.length < 350_000).slice(0, 5),
    }
    localStorage.setItem(attractionMetadataKey(id), JSON.stringify(compact))
  } catch {
    // localStorage có thể đầy khi người dùng chọn ảnh lớn; bỏ qua để không ảnh hưởng API.
  }
}

function statusLabel(status: AttractionStatus) {
  return status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'
}

function categoryClass(category: string) {
  if (category.includes('Khu du lịch')) return 'pink'
  if (category.includes('Văn hóa')) return 'orange'
  if (category.includes('Kiến trúc')) return 'purple'
  if (category.includes('Mua sắm')) return 'blue'
  if (category.includes('Giải trí')) return 'cyan'
  return 'green'
}

function AttractionThumb({ attraction, index = 0 }: { attraction: Attraction; index?: number }) {
  const extra = loadAttractionExtra(attraction)
  const src = extra.images[0] || attraction.hinhAnh || ''
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img className="provider-attraction-thumb" src={src} alt="" onError={() => setFailed(true)} />
  return (
    <div className={`provider-attraction-thumb attraction-thumb-fallback variant-${(attraction.id + index) % 5}`} aria-hidden="true">
      <span className="attraction-thumb-sky" />
      <span className="attraction-thumb-water" />
      <span className="attraction-thumb-land"><i/><i/><i/></span>
    </div>
  )
}

export default function ProviderAttractionsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [remove, setRemove] = useState<Attraction | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    attractionApi.mine().then(setData).catch(e => setError(apiError(e))).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cities = useMemo(() => Array.from(new Set(data.map(item => item.thanhPho).filter(Boolean))), [data])
  const shown = useMemo(() => data.filter(item => {
    const extra = loadAttractionExtra(item)
    const text = `${item.tenDiaDiem} ${item.thanhPho} ${item.diaChi} ${item.moTa}`.toLowerCase()
    return (!q || text.includes(q.toLowerCase())) && (!city || item.thanhPho === city) && (!category || extra.category === category)
  }), [data, q, city, category])

  useEffect(() => setPage(1), [q, city, category])
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const currentPage = Math.min(page, pages)
  const paged = shown.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const del = async () => {
    if (!remove) return
    setBusy(true)
    setError('')
    try {
      await attractionApi.remove(remove.id)
      try { localStorage.removeItem(attractionMetadataKey(remove.id)) } catch { /* ignore */ }
      setRemove(null)
      load()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="provider-attractions-v2">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><span>Quản lý địa điểm tham quan</span><span>›</span><strong>Danh sách địa điểm</strong></div>

      <section className="provider-attraction-list-heading">
        <div><h1>Danh sách địa điểm tham quan</h1><p>Quản lý các địa điểm tham quan bạn cung cấp.</p></div>
        <button className="provider-attraction-add" onClick={() => navigate('/provider/attractions/new')}><Plus/> Thêm địa điểm</button>
      </section>

      {error && <div className="hotel-inline-error">{error}</div>}

      <section className="provider-attraction-table-card">
        <div className="provider-attraction-filters">
          <div className="provider-attraction-search"><Search/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm kiếm theo tên địa điểm, thành phố..."/></div>
          <label><span>Thành phố</span><select value={city} onChange={e => setCity(e.target.value)}><option value="">Tất cả</option>{cities.map(item => <option key={item}>{item}</option>)}</select></label>
          <label><span>Loại địa điểm</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="">Tất cả</option>{ATTRACTION_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
          <button className="provider-attraction-filter-button"><Filter/> Bộ lọc</button>
        </div>

        {loading ? <Loading label="Đang tải danh sách địa điểm..."/> : error && !data.length ? <ErrorState message={error} onRetry={load}/> : shown.length === 0 ? <EmptyState title="Không tìm thấy địa điểm tham quan"/> : (
          <div className="provider-attraction-table-wrap">
            <table className="provider-attraction-table">
              <thead><tr><th>STT</th><th>Ảnh</th><th>Tên địa điểm</th><th>Loại địa điểm</th><th>Thành phố</th><th>Mô tả ngắn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{paged.map((item,index) => {
                const extra = loadAttractionExtra(item)
                return <tr key={item.id}>
                  <td className="attraction-index">{(currentPage - 1) * PER_PAGE + index + 1}</td>
                  <td><AttractionThumb attraction={item} index={index}/></td>
                  <td><strong className="attraction-name">{item.tenDiaDiem}</strong></td>
                  <td><span className={`attraction-category ${categoryClass(extra.category)}`}>{extra.category}</span></td>
                  <td className="attraction-city">{item.thanhPho}</td>
                  <td><div className="attraction-description">{item.moTa || 'Chưa có mô tả'}</div></td>
                  <td><span className={`provider-hotel-status ${item.trangThai === 'ACTIVE' ? 'active' : 'paused'}`}>{statusLabel(item.trangThai)}</span></td>
                  <td><div className="provider-attraction-actions">
                    <button title="Xem" onClick={() => navigate(`/provider/attractions/${item.id}`)}><Eye/></button>
                    <button title="Sửa" onClick={() => navigate(`/provider/attractions/${item.id}/edit`)}><Edit3/></button>
                    <button title="Xóa" className="delete" onClick={() => setRemove(item)}><Trash2/></button>
                  </div></td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}

        <div className="provider-hotel-pagination">
          <span>Hiển thị {shown.length ? (currentPage-1)*PER_PAGE+1 : 0} - {Math.min(currentPage*PER_PAGE, shown.length)} của {shown.length} địa điểm</span>
          <div><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft/></button>{Array.from({length:pages},(_,i)=>i+1).slice(0,5).map(item=><button key={item} className={item===currentPage?'active':''} onClick={()=>setPage(item)}>{item}</button>)}<button disabled={currentPage===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}><ChevronRight/></button></div>
        </div>
      </section>

      {remove && <div className="attraction-modal-backdrop" onMouseDown={() => !busy && setRemove(null)}>
        <div className="attraction-delete-modal" onMouseDown={e => e.stopPropagation()}>
          <button className="attraction-delete-close" onClick={() => setRemove(null)}><X/></button>
          <span className="attraction-delete-icon"><Trash2/></span>
          <h3>Xóa địa điểm tham quan</h3>
          <p>Bạn có chắc chắn muốn xóa địa điểm tham quan<br/><strong>“{remove.tenDiaDiem}”?</strong></p>
          <div className="attraction-delete-warning"><span>!</span><div><strong>Hành động này không thể hoàn tác.</strong><small>Tất cả dữ liệu liên quan đến địa điểm sẽ bị xóa.</small></div></div>
          <div className="attraction-delete-actions"><button onClick={()=>setRemove(null)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void del()}><Trash2/>{busy?'Đang xóa...':'Xóa địa điểm'}</button></div>
        </div>
      </div>}
    </div>
  )
}
