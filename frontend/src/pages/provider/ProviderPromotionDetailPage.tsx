import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Edit3, PauseCircle, Tag, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fromPromotionApi, promotionScopeText, promotionStatusText, promotionValueText, type Promotion } from '../../data/promotions'
import { promotionApi } from '../../api/services'
import { apiError, money } from '../../utils/format'

export default function ProviderPromotionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirm, setConfirm] = useState<'pause' | 'delete' | null>(null)
  const [message, setMessage] = useState(searchParams.get('saved') ? searchParams.get('saved') === 'created' ? 'Tạo ưu đãi thành công.' : 'Cập nhật ưu đãi thành công.' : '')
  const [item, setItem] = useState<Promotion | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    if (!id) return
    setLoading(true)
    try { setItem(fromPromotionApi(await promotionApi.detail(Number(id)))) } catch (e) { setError(apiError(e)) } finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [id])

  const closeSuccess = () => { setMessage(''); setSearchParams({}) }
  const stop = async () => {
    if (!item) return
    try { setItem(fromPromotionApi(await promotionApi.deactivate(item.id))); setMessage('Ngừng áp dụng ưu đãi thành công.') } catch (e) { setError(apiError(e)) } finally { setConfirm(null) }
  }
  const remove = async () => {
    if (!item) return
    try {
      const result = await promotionApi.remove(item.id)
      setConfirm(null)
      if (result.deleted) { navigate('/provider/promotions'); return }
      setMessage(result.message)
      await reload()
    } catch (e) { setError(apiError(e)); setConfirm(null) }
  }

  if (loading) return <div className="provider-promotions-page"><div className="promotion-admin-empty">Đang tải ưu đãi từ Promotion Service...</div></div>
  if (error || !item) return <div className="provider-promotions-page"><div className="promotion-admin-empty">{error || 'Không tìm thấy ưu đãi.'}</div></div>
  const maxUsage = item.maxUsage || 0
  const percent = maxUsage > 0 ? Math.min(100, (item.usedCount / maxUsage) * 100) : 0

  return <div className="provider-promotion-detail-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/promotions">Quản lý ưu đãi</Link><span>›</span><strong>Chi tiết ưu đãi</strong></div>
    <div className="promotion-detail-actions-top"><Link to="/provider/promotions"><ArrowLeft/>Quay lại danh sách</Link><div><button onClick={() => navigate(`/provider/promotions/${item.id}/edit`)}><Edit3/>Chỉnh sửa</button><button className="danger" onClick={() => setConfirm(item.usedCount > 0 ? 'pause' : 'delete')}><Trash2/>{item.usedCount > 0 ? 'Ngừng áp dụng' : 'Xóa ưu đãi'}</button></div></div>
    <section className="promotion-detail-hero"><div className={`promotion-detail-visual scope-${item.scope.toLowerCase()} ${item.imageUrl ? 'has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt={`Ảnh ưu đãi ${item.name}`} /> : <><Tag/><strong>{promotionValueText(item)}</strong><small>{item.code}</small></>}</div><div><div className="promotion-detail-title-row"><h1>{item.name}</h1><span className={`promotion-admin-status ${item.status.toLowerCase()}`}>{promotionStatusText(item.status)}</span></div><p>{item.description}</p><div className="promotion-detail-code"><span>Mã ưu đãi</span><code>{item.code}</code></div></div></section>
    <div className="promotion-detail-columns"><main><section className="promotion-detail-card"><h2>Thông tin ưu đãi</h2><dl><div><dt>Loại giảm</dt><dd>{item.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định (VNĐ)'}</dd></div><div><dt>Giá trị giảm</dt><dd>{promotionValueText(item)}</dd></div><div><dt>Đơn hàng tối thiểu</dt><dd>{money(item.minOrderAmount)}</dd></div><div><dt>Giảm tối đa</dt><dd>{item.maxDiscountAmount ? money(item.maxDiscountAmount) : 'Không giới hạn'}</dd></div><div><dt>Dịch vụ áp dụng</dt><dd>{item.serviceName}</dd></div><div><dt>Phạm vi</dt><dd>{promotionScopeText(item.scope)}</dd></div></dl></section><section className="promotion-detail-card"><h2>Thời gian & giới hạn</h2><div className="promotion-detail-stat-grid"><div><CalendarDays/><span>Ngày bắt đầu</span><strong>{item.startDate.split('-').reverse().join('/')}</strong></div><div><CalendarDays/><span>Ngày kết thúc</span><strong>{item.endDate.split('-').reverse().join('/')}</strong></div><div><UsersRound/><span>Số lượt tối đa</span><strong>{item.maxUsage ? item.maxUsage.toLocaleString('vi-VN') : 'Không giới hạn'}</strong></div><div><UsersRound/><span>Mỗi khách hàng</span><strong>{item.perCustomerLimit ? `${item.perCustomerLimit} lượt` : 'Không giới hạn'}</strong></div></div></section></main><aside><section className="promotion-detail-card promotion-usage-card"><h2>Tình trạng sử dụng</h2><div className="promotion-usage-number"><strong>{item.usedCount}</strong><span>{item.maxUsage ? ` / ${item.maxUsage.toLocaleString('vi-VN')} lượt` : ' lượt đã xác nhận'}</span></div>{item.maxUsage ? <><div className="promotion-usage-track"><i style={{ width: `${percent}%` }}/></div><small>Đã sử dụng {Math.round(percent)}% tổng hạn mức.</small></> : <small>Không đặt giới hạn tổng lượt sử dụng.</small>}</section><section className="promotion-detail-card"><h2>Thông tin hệ thống</h2><dl><div><dt>Nhà cung cấp</dt><dd>{item.providerName}</dd></div><div><dt>Ngày tạo</dt><dd>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}</dd></div><div><dt>Cập nhật lần cuối</dt><dd>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : '—'}</dd></div></dl></section></aside></div>

    {confirm && <div className="promotion-modal-backdrop" onMouseDown={() => setConfirm(null)}><div className="provider-promotion-confirm" onMouseDown={event => event.stopPropagation()}><button className="promotion-modal-close" onClick={() => setConfirm(null)}>×</button><span className="provider-promotion-confirm-icon warning"><AlertTriangle/></span><h2>{confirm === 'pause' ? 'Ngừng áp dụng ưu đãi?' : 'Xóa ưu đãi?'}</h2><p>Bạn có chắc chắn muốn {confirm === 'pause' ? 'ngừng áp dụng' : 'xóa'} ưu đãi <strong>“{item.name}”</strong>?</p>{item.usedCount > 0 && <div className="provider-promotion-warning">Ưu đãi đã có {item.usedCount} lượt sử dụng. Những Booking đã áp dụng trước đó sẽ không bị đổi tổng tiền.</div>}<div className="provider-promotion-confirm-actions"><button onClick={() => setConfirm(null)}>Hủy</button><button className="danger" onClick={confirm === 'pause' ? stop : remove}>{confirm === 'pause' ? <PauseCircle/> : <Trash2/>}{confirm === 'pause' ? 'Ngừng áp dụng' : 'Xóa ưu đãi'}</button></div></div></div>}

    {message && <div className="promotion-modal-backdrop" onMouseDown={closeSuccess}><div className="promotion-success-modal provider" onMouseDown={event => event.stopPropagation()}><span className="promotion-success-icon"><CheckCircle2/></span><h2>{message}</h2><p>Dữ liệu đã được cập nhật tại Promotion Service.</p><button className="promotion-primary-button" onClick={closeSuccess}>Quay lại chi tiết</button></div></div>}
  </div>
}
