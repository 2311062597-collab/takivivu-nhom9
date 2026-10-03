import { CalendarDays, Copy, Gift, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fromPromotionApi, loadSavedPromotionIds, promotionScopeText, promotionValueText, removeSavedPromotion, type Promotion } from '../../data/promotions'
import { promotionApi } from '../../api/services'

export default function MyPromotionsPage() {
  const [version, setVersion] = useState(0)
  const [tab, setTab] = useState<'active' | 'expired'>('active')
  const [all, setAll] = useState<Promotion[]>([])
  useEffect(() => { promotionApi.available().then(items => setAll(items.map(fromPromotionApi))).catch(() => setAll([])) }, [version])
  const items = useMemo(() => { const saved = new Set(loadSavedPromotionIds()); return all.filter(item => saved.has(item.id)) }, [all, version])
  const shown = items.filter(item => tab === 'active' ? item.status === 'ACTIVE' || item.status === 'SCHEDULED' : item.status === 'EXPIRED' || item.status === 'INACTIVE')
  const remove = (id: number) => { removeSavedPromotion(id); setVersion(value => value + 1) }
  return <div className="container customer-my-promos-page"><div className="customer-my-promos-head"><div><span>ƯU ĐÃI</span><h1>Ưu đãi đã lưu</h1><p>Các ưu đãi bạn đánh dấu trên thiết bị này. Thông tin hiệu lực và giá trị ưu đãi luôn được hệ thống kiểm tra lại.</p></div><Link to="/promotions">Khám phá thêm ưu đãi</Link></div><div className="customer-my-promos-tabs"><button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Đang hiệu lực ({items.filter(item => item.status === 'ACTIVE' || item.status === 'SCHEDULED').length})</button><button className={tab === 'expired' ? 'active' : ''} onClick={() => setTab('expired')}>Đã hết hạn ({items.filter(item => item.status === 'EXPIRED' || item.status === 'INACTIVE').length})</button></div><div className="customer-my-promos-list">{shown.length ? shown.map(item => <article key={item.id}><div className={`customer-my-promo-thumb scope-${item.scope.toLowerCase()}`}><Gift/><b>{promotionValueText(item)}</b></div><div className="customer-my-promo-info"><h3>{item.name}</h3><p><span>{promotionScopeText(item.scope)}</span> · HSD {item.endDate.split('-').reverse().join('/')}</p><code>{item.code}</code></div><div className="customer-my-promo-actions"><button onClick={() => navigator.clipboard.writeText(item.code)}><Copy/>Sao chép</button><Link to={`/promotions/${item.id}`}>Xem chi tiết</Link><button className="danger" onClick={() => remove(item.id)}><Trash2/>Bỏ lưu</button></div></article>) : <div className="customer-my-promos-empty"><CalendarDays/><h3>Chưa có ưu đãi trong mục này</h3><p>Hãy khám phá và lưu những mã phù hợp với chuyến đi của bạn.</p><Link to="/promotions">Xem ưu đãi</Link></div>}</div></div>
}
