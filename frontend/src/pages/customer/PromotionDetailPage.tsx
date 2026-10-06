import { ArrowLeft, CalendarDays, CheckCircle2, Copy, Gift, Hotel, Landmark, Plane, ShieldCheck, TicketCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fromPromotionApi, promotionScopeText, promotionValueText, type Promotion } from '../../data/promotions'
import { promotionApi } from '../../api/services'
import { money } from '../../utils/format'

function ScopeIcon({ item }: { item: Promotion }) {
  if (item.scope === 'FLIGHT') return <Plane/>
  if (item.scope === 'HOTEL') return <Hotel/>
  if (item.scope === 'ATTRACTION') return <Landmark/>
  return <Gift/>
}

export default function PromotionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Promotion | null>(null)
  const [related, setRelated] = useState<Promotion[]>([])
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([promotionApi.publicDetail(Number(id)), promotionApi.available()]).then(([detail, list]) => {
      if (!active) return
      const current = fromPromotionApi(detail)
      setItem(current)
      setRelated(list.map(fromPromotionApi).filter(value => value.id !== current.id).slice(0, 3))
    }).catch(() => { if (active) setItem(null) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  if (loading) return <div className="container pad"><div className="empty">Đang tải ưu đãi...</div></div>
  if (!item) return <div className="container pad"><div className="empty"><strong>Không tìm thấy ưu đãi.</strong><Link to="/promotions">Quay lại danh sách</Link></div></div>
  const getCode = async () => { await promotionApi.saveForCustomer(item.id); try { await navigator.clipboard.writeText(item.code) } catch {} setClaimed(true) }
  const remain = item.maxUsage == null ? null : Math.max(0, item.maxUsage - item.usedCount)

  return <div className="customer-promo-detail-page"><div className="container customer-promo-detail-wrap">
    <div className="customer-promo-detail-breadcrumb"><Link to="/promotions"><ArrowLeft/>Quay lại ưu đãi</Link></div>
    <section className="customer-promo-detail-main"><div className={`customer-promo-detail-image scope-${item.scope.toLowerCase()} ${item.imageUrl ? 'has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <><span/><i/></>}<b>{promotionValueText(item)}</b></div><div className="customer-promo-detail-info"><div className="customer-promo-detail-top"><span className="customer-promo-discount">{promotionValueText(item)}</span><span className="customer-promo-scope"><ScopeIcon item={item}/>{promotionScopeText(item.scope)}</span></div><h1>{item.name}</h1><p>{item.description}</p><div className="customer-promo-detail-code"><span><small>Mã ưu đãi</small><strong>{item.code}</strong></span><button onClick={() => void getCode()}><Copy/>Lấy mã áp dụng</button></div><div className="customer-promo-detail-meta"><span><CalendarDays/>Hiệu lực đến <b>{item.endDate.split('-').reverse().join('/')}</b></span><span><TicketCheck/>{remain == null ? 'Không giới hạn tổng lượt' : `Còn ${remain.toLocaleString('vi-VN')} lượt`}</span></div></div></section>
    <section className="customer-promo-detail-grid"><article><h2>Thông tin ưu đãi</h2><dl><div><dt>Hình thức giảm</dt><dd>{item.discountType === 'PERCENTAGE' ? 'Giảm theo phần trăm' : 'Giảm số tiền cố định'}</dd></div><div><dt>Giá trị giảm</dt><dd>{promotionValueText(item)}</dd></div><div><dt>Đơn hàng tối thiểu</dt><dd>{money(item.minOrderAmount)}</dd></div>{item.maxDiscountAmount && <div><dt>Giảm tối đa</dt><dd>{money(item.maxDiscountAmount)}</dd></div>}<div><dt>Phạm vi áp dụng</dt><dd>{item.serviceName}</dd></div></dl></article><article><h2>Điều kiện áp dụng</h2><ul><li>Áp dụng từ {item.startDate.split('-').reverse().join('/')} đến {item.endDate.split('-').reverse().join('/')}.</li><li>{item.perCustomerLimit ? `Mỗi khách hàng sử dụng tối đa ${item.perCustomerLimit} lần.` : 'Không giới hạn lượt theo khách hàng.'}</li><li>Không áp dụng đồng thời với mã khác.</li><li>Giá trị đơn hàng phải đạt tối thiểu {money(item.minOrderAmount)}.</li><li>Hệ thống sẽ kiểm tra ưu đãi có áp dụng đúng dịch vụ và nhà cung cấp.</li></ul><div className="customer-promo-safe"><ShieldCheck/>Mã ưu đãi sẽ được kiểm tra điều kiện và tính mức giảm trước khi xác nhận đơn.</div></article></section>
    <section className="customer-promo-related"><div className="customer-promo-section-head"><div><span>GỢI Ý</span><h2>Ưu đãi liên quan</h2></div></div><div className="customer-promo-all-grid">{related.map(value => <article className="customer-promo-small" key={value.id}><div className={`customer-promo-visual scope-${value.scope.toLowerCase()} ${value.imageUrl ? 'has-image' : ''}`}>{value.imageUrl && <img src={value.imageUrl} alt={value.name} />}<b>{promotionValueText(value)}</b></div><div><span>{promotionScopeText(value.scope)}</span><h3>{value.name}</h3><p>Mã: <strong>{value.code}</strong></p><div><Link to={`/promotions/${value.id}`}>Chi tiết</Link><button onClick={() => { void promotionApi.saveForCustomer(value.id).then(() => setClaimed(true)) }}>Lấy mã</button></div></div></article>)}</div></section>
  </div>{claimed && <div className="promotion-modal-backdrop" onMouseDown={() => setClaimed(false)}><div className="promotion-success-modal" onMouseDown={event => event.stopPropagation()}><span className="promotion-success-icon"><CheckCircle2/></span><h2>Đã lưu mã ưu đãi!</h2><p>Bạn có thể sử dụng mã <strong>{item.code}</strong> khi tạo Booking.</p><div className="promotion-success-code">{item.code}</div><button className="promotion-primary-button" onClick={() => setClaimed(false)}>Tiếp tục khám phá</button></div></div>}</div>
}
