import { BedDouble, CheckCircle2, Copy, Gift, Landmark, Plane, Search, Sparkles, Tag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { promotionApi } from '../../api/services'
import { fromPromotionApi, promotionScopeText, promotionStatusText, promotionValueText, type Promotion, type PromotionScope } from '../../data/promotions'
import { money } from '../../utils/format'

const tabs: Array<{ value: '' | PromotionScope; label: string; icon: typeof Gift }> = [
  { value: '', label: 'Tất cả', icon: Gift },
  { value: 'FLIGHT', label: 'Chuyến bay', icon: Plane },
  { value: 'HOTEL', label: 'Khách sạn', icon: BedDouble },
  { value: 'ATTRACTION', label: 'Địa điểm tham quan', icon: Landmark },
]

function PromoArt({ item }: { item: Promotion }) {
  const Icon = item.scope === 'FLIGHT' ? Plane : item.scope === 'HOTEL' ? BedDouble : Landmark
  return <div className={`promo-backend-art-v4 type-${item.scope.toLowerCase()} ${item.imageUrl ? 'has-image' : ''}`}>
    {item.imageUrl ? <img src={item.imageUrl} alt={`Ảnh ưu đãi ${item.name}`} /> : <Icon/>}
    <span className="promo-backend-badge-v4">{promotionValueText(item)}</span>
    <div><small>{promotionScopeText(item.scope)}</small><b>{item.providerName}</b></div>
  </div>
}

export default function PromotionsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Promotion[]>([])
  const [category, setCategory] = useState<'' | PromotionScope>('')
  const [query, setQuery] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimed, setClaimed] = useState<Promotion | null>(null)
  const [codeError, setCodeError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 2

  const load = async () => {
    setLoading(true); setError('')
    try { setItems((await promotionApi.available()).map(fromPromotionApi)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải ưu đãi từ Promotion Service.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => items.filter(item => {
    if (category && item.scope !== category) return false
    const haystack = `${item.name} ${item.code} ${item.description} ${item.providerName}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [items, category, query])
  const featured = filtered.slice(0, 3)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pagedItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => { setPage(1) }, [category, query])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])
  const counts = useMemo(() => ({ ALL: items.length, FLIGHT: items.filter(x => x.scope === 'FLIGHT').length, HOTEL: items.filter(x => x.scope === 'HOTEL').length, ATTRACTION: items.filter(x => x.scope === 'ATTRACTION').length }), [items])

  const copyCode = async (item: Promotion) => {
    await promotionApi.saveForCustomer(item.id)
    try { await navigator.clipboard.writeText(item.code) } catch { /* clipboard permission */ }
    setClaimed(item); setCodeError('')
  }

  const findCode = () => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) { setCodeError('Vui lòng nhập mã ưu đãi.'); return }
    const found = items.find(item => item.code.toUpperCase() === normalized)
    if (!found) { setCodeError('Mã này không nằm trong danh sách ưu đãi đang hoạt động từ Promotion Service.'); return }
    void copyCode(found)
  }

  return <div className="promotions-backend-page-v4 promo-sample-page">
    <section className="promo-sample-hero">
      <div className="container promo-sample-hero-inner">
        <div className="promo-sample-copy">
          <span><Sparkles/> Ưu đãi dành riêng cho bạn</span>
          <h1>Khám phá hàng ngàn ưu đãi hấp dẫn từ TAKIVIVU</h1>
          <div className="promotions-code-search-v4"><Tag/><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') findCode() }} placeholder="Tìm kiếm ưu đãi, mã giảm giá..."/><button onClick={findCode}><Search/> Tìm kiếm</button></div>
          {codeError && <small className="promo-code-error-v4">{codeError}</small>}
        </div>
        <div className="promo-sample-slogan">Đi nhiều hơn<br/><b>Trải nghiệm nhiều hơn</b><Plane/></div>
      </div>
    </section>

    <div className="container promotions-backend-wrap-v4 promo-sample-content">
      <div className="promotions-tabs-v4 promo-sample-tabs">{tabs.map(tab => { const Icon = tab.icon; const count = tab.value ? counts[tab.value] : counts.ALL; return <button key={tab.label} className={category === tab.value ? 'active' : ''} onClick={() => setCategory(tab.value)}><Icon/>{tab.label}<b>{count}</b></button> })}</div>

      {loading ? <div className="promo-loading-skeleton"><i/><i/><i/></div> : error ? <div className="promotions-backend-state-v4 error"><strong>Không thể tải ưu đãi</strong><p>{error}</p><button onClick={() => void load()}>Thử lại</button></div> : items.length === 0 ? <div className="promotions-backend-state-v4"><Gift/><strong>Chưa có ưu đãi đang hoạt động</strong><p>Ưu đãi ACTIVE từ nhà cung cấp sẽ xuất hiện tại đây.</p></div> : <>
        <section className="promotions-featured-v4 promo-sample-featured"><div className="promotions-section-head-v4"><div><span>Ưu đãi nổi bật</span></div><button className="promo-see-all" onClick={() => setCategory('')}>Xem tất cả →</button></div><div className="promotions-featured-grid-v4">{featured.map(item => <article key={item.id} className="promo-clickable-card" onClick={() => navigate(`/promotions/${item.id}`)}><PromoArt item={item}/><div className="promotions-featured-body-v4"><h3>{item.name}</h3><p>{item.description || `Ưu đãi từ ${item.providerName}`}</p><div className="promo-card-meta-v4"><span>HSD: {new Date(item.endDate).toLocaleDateString('vi-VN')}</span></div><div className="promo-card-actions-v4"><button onClick={(event) => { event.stopPropagation(); void copyCode(item) }}>Lấy mã</button><Link onClick={(event) => event.stopPropagation()} to={`/promotions/${item.id}`}>Chi tiết</Link></div></div></article>)}</div></section>

        <section className="promo-all-section"><div className="promotions-section-head-v4"><div><span>Tất cả ưu đãi</span></div></div><div className="promo-all-grid">{pagedItems.map(item => { const Icon = item.scope === 'FLIGHT' ? Plane : item.scope === 'HOTEL' ? BedDouble : Landmark; return <article key={item.id} className="promo-compact-card promo-clickable-card" onClick={() => navigate(`/promotions/${item.id}`)}><div className="promo-compact-icon">{item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <Icon/>}</div><div className="promo-compact-main"><h3>{item.name}</h3><p>{promotionScopeText(item.scope)}</p><div className="promo-compact-meta"><code>{item.code}</code><small>HSD: {new Date(item.endDate).toLocaleDateString('vi-VN')}</small></div></div><button onClick={(event) => { event.stopPropagation(); void copyCode(item) }}>Lấy mã</button></article> })}</div>{totalPages > 1 && <nav className="promo-pagination" aria-label="Phân trang ưu đãi"><button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>{Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} className={page === n ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>)}<button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button></nav>}</section>
      </>}
    </div>

    {claimed && <div className="promotion-modal-backdrop" onMouseDown={() => setClaimed(null)}><div className="promotion-success-modal" onMouseDown={e => e.stopPropagation()}><button className="promotion-modal-close" onClick={() => setClaimed(null)}>×</button><span className="promotion-success-icon"><CheckCircle2/></span><h2>Đã lấy mã ưu đãi!</h2><p>Mã sẽ được Promotion Service kiểm tra lại khi tạo Booking.</p><div className="promotion-success-code">{claimed.code}<button onClick={() => navigator.clipboard.writeText(claimed.code)}><Copy/></button></div><Link className="promotion-primary-button" to={`/promotions/${claimed.id}`}>Xem ưu đãi chi tiết</Link><button className="promotion-text-button" onClick={() => setClaimed(null)}>Tiếp tục khám phá</button></div></div>}
  </div>
}
