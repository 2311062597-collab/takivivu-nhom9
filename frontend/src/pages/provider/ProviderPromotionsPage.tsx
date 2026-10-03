import { ChevronLeft, ChevronRight, Edit3, Eye, Filter, MoreHorizontal, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fromPromotionApi, promotionScopeText, promotionStatusText, promotionValueText, type Promotion, type PromotionStatus } from '../../data/promotions'
import { promotionApi } from '../../api/services'
import { apiError } from '../../utils/format'

const PER_PAGE = 6

function statusClass(status: PromotionStatus) {
  if (status === 'ACTIVE') return 'active'
  if (status === 'SCHEDULED') return 'scheduled'
  if (status === 'INACTIVE') return 'inactive'
  return 'expired'
}

export default function ProviderPromotionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [rows, setRows] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [scope, setScope] = useState('')
  const [page, setPage] = useState(1)
  const [remove, setRemove] = useState<Promotion | null>(null)
  const [result, setResult] = useState('')
  const reload = async () => {
    setLoading(true)
    try { setRows((await promotionApi.mine()).map(fromPromotionApi)) } catch (e) { setResult(apiError(e)) } finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])
  useEffect(() => {
    const message = (location.state as { success?: string } | null)?.success
    if (!message) return
    setResult(message)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])
  const filtered = rows.filter(item => {
    const text = `${item.name} ${item.code} ${item.description}`.toLowerCase()
    return (!query || text.includes(query.toLowerCase())) && (!status || item.status === status) && (!scope || item.scope === scope)
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pages)
  const paged = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const confirmDelete = async () => {
    if (!remove) return
    try {
      const outcome = await promotionApi.remove(remove.id)
      setResult(outcome.message)
      setRemove(null)
      await reload()
    } catch (e) { setResult(apiError(e)); setRemove(null) }
  }

  return <div className="provider-promotions-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Quản lý ưu đãi</strong></div>
    <section className="promotion-admin-heading"><div><h1>Quản lý ưu đãi</h1><p>Tạo và quản lý các chương trình ưu đãi dành cho dịch vụ của bạn.</p></div><button onClick={() => navigate('/provider/promotions/new')}><Plus/>Thêm ưu đãi</button></section>
    {result && <div className="promotion-admin-success"><Tag/>{result}<button onClick={() => setResult('')}>×</button></div>}
    <section className="promotion-admin-card">
      <div className="promotion-admin-filters"><div className="promotion-admin-search"><Search/><input value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Tìm kiếm theo tên ưu đãi, mã ưu đãi..."/></div><select value={scope} onChange={event => { setScope(event.target.value); setPage(1) }}><option value="">Tất cả dịch vụ</option><option value="FLIGHT">Chuyến bay</option><option value="HOTEL">Khách sạn</option><option value="ATTRACTION">Địa điểm tham quan</option><option value="ALL">Toàn hệ thống</option></select><select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang áp dụng</option><option value="SCHEDULED">Sắp diễn ra</option><option value="INACTIVE">Đã ngừng</option><option value="EXPIRED">Đã kết thúc</option></select><button className="promotion-admin-filter-button"><Filter/>Bộ lọc</button></div>
      <div className="promotion-admin-table-wrap"><table className="promotion-admin-table"><thead><tr><th>STT</th><th>Tên ưu đãi</th><th>Mã ưu đãi</th><th>Loại giảm</th><th>Giá trị</th><th>Thời gian áp dụng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{paged.map((item, index) => <tr key={item.id}><td>{(current - 1) * PER_PAGE + index + 1}</td><td><div className="promotion-admin-name"><span className={`promotion-admin-thumb scope-${item.scope.toLowerCase()} ${item.imageUrl ? 'has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt={`Ảnh ${item.name}`} /> : <Tag/>}</span><div><strong>{item.name}</strong><small>{promotionScopeText(item.scope)}</small></div></div></td><td><code>{item.code}</code></td><td>{item.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}</td><td><strong>{promotionValueText(item)}</strong></td><td><span>{item.startDate.split('-').reverse().join('/')}</span><small>→ {item.endDate.split('-').reverse().join('/')}</small></td><td><span className={`promotion-admin-status ${statusClass(item.status)}`}>{promotionStatusText(item.status)}</span></td><td><div className="promotion-admin-actions"><button title="Xem chi tiết" onClick={() => navigate(`/provider/promotions/${item.id}`)}><Eye/></button><button title="Chỉnh sửa" onClick={() => navigate(`/provider/promotions/${item.id}/edit`)}><Edit3/></button><button title="Ngừng / Xóa" className="danger" onClick={() => setRemove(item)}><Trash2/></button><button title="Khác"><MoreHorizontal/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="promotion-admin-empty">Không tìm thấy ưu đãi phù hợp.</div>}</div>
      <div className="promotion-admin-pagination"><span>Hiển thị {filtered.length ? (current - 1) * PER_PAGE + 1 : 0} - {Math.min(current * PER_PAGE, filtered.length)} của {filtered.length} ưu đãi</span><div><button disabled={current === 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft/></button>{Array.from({ length: Math.min(pages, 5) }, (_, index) => index + 1).map(value => <button className={value === current ? 'active' : ''} key={value} onClick={() => setPage(value)}>{value}</button>)}<button disabled={current === pages} onClick={() => setPage(value => Math.min(pages, value + 1))}><ChevronRight/></button></div></div>
    </section>

    {remove && <div className="promotion-modal-backdrop" onMouseDown={() => setRemove(null)}><div className="provider-promotion-confirm" onMouseDown={event => event.stopPropagation()}><button className="promotion-modal-close" onClick={() => setRemove(null)}>×</button><span className="provider-promotion-confirm-icon"><Trash2/></span><h2>{remove.usedCount > 0 ? 'Ngừng áp dụng ưu đãi?' : 'Xóa ưu đãi?'}</h2><p>Bạn có chắc chắn muốn {remove.usedCount > 0 ? 'ngừng áp dụng' : 'xóa'} ưu đãi <strong>“{remove.name}”</strong>?</p>{remove.usedCount > 0 && <div className="provider-promotion-warning">Ưu đãi đã phát sinh {remove.usedCount} lượt sử dụng nên sẽ không bị xóa vật lý. Hệ thống sẽ chuyển trạng thái sang INACTIVE.</div>}<div className="provider-promotion-confirm-actions"><button onClick={() => setRemove(null)}>Hủy</button><button className="danger" onClick={confirmDelete}><Trash2/>{remove.usedCount > 0 ? 'Ngừng áp dụng' : 'Xóa ưu đãi'}</button></div></div></div>}
  </div>
}
