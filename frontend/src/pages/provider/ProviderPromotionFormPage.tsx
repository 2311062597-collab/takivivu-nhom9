import { ArrowLeft, CalendarDays, Check, CircleDollarSign, ImagePlus, Save, Tag, TicketPercent } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fromPromotionApi, type PromotionDiscountType, type PromotionScope } from '../../data/promotions'
import { attractionApi, flightApi, hotelApi, promotionApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import { apiError } from '../../utils/format'

interface FormState {
  name: string
  code: string
  description: string
  imageUrl: string
  discountType: PromotionDiscountType
  discountValue: string
  minOrderAmount: string
  maxDiscountAmount: string
  startDate: string
  endDate: string
  maxUsage: string
  perCustomerLimit: string
  scope: PromotionScope
  serviceIds: number[]
}

export default function ProviderPromotionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const editing = Boolean(id)
  const providerScope = (session?.loaiNhaCungCap || 'HOTEL') as PromotionScope
  const [form, setForm] = useState<FormState>({
    name: '', code: '', description: '', imageUrl: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '0', maxDiscountAmount: '',
    startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    maxUsage: '1000', perCustomerLimit: '1', scope: providerScope, serviceIds: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(editing)
  const [fatal, setFatal] = useState('')
  const [busy, setBusy] = useState(false)
  const [scopeOptions, setScopeOptions] = useState<{id:number; label:string; group:string}[]>([])
  const [selectedParent, setSelectedParent] = useState('')
  const [selectedChild, setSelectedChild] = useState('')
  const [applyAll, setApplyAll] = useState(false)
  const [flightFares, setFlightFares] = useState<{id:number;hangVe:string}[]>([])

  useEffect(() => {
    if (!editing || !id) return
    let active = true
    promotionApi.detail(Number(id)).then(raw => {
      if (!active) return
      const current = fromPromotionApi(raw)
      setForm({
        name: current.name,
        code: current.code,
        description: current.description,
        imageUrl: raw.imageUrl || '',
        discountType: current.discountType,
        discountValue: String(current.discountValue),
        minOrderAmount: String(current.minOrderAmount || 0),
        maxDiscountAmount: current.maxDiscountAmount ? String(current.maxDiscountAmount) : '',
        startDate: current.startDate,
        endDate: current.endDate,
        maxUsage: current.maxUsage ? String(current.maxUsage) : '',
        perCustomerLimit: current.perCustomerLimit ? String(current.perCustomerLimit) : '',
        scope: current.scope,
        serviceIds: current.serviceIds,
      })
      // Khôi phục phạm vi đã lưu khi mở màn hình chỉnh sửa.
      if(current.serviceIds.length){setSelectedParent(String(current.serviceIds[0]));setApplyAll(false)}else{setApplyAll(true)}
    }).catch(e => { if (active) setFatal(apiError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id])


  useEffect(() => {
    if (editing) return
    let active = true
    promotionApi.generateCode().then(code => { if (active) setForm(previous => ({ ...previous, code })) }).catch(() => {})
    return () => { active = false }
  }, [editing])

  useEffect(() => {
    if (session?.vaiTro !== 'PROVIDER') return
    let active = true
    const load = async () => {
      try {
        if (providerScope === 'FLIGHT') {
          const flights = await flightApi.mine()
          if (active) setScopeOptions(flights.map(f => ({ id:f.id, group:`${f.maChuyenBay}: ${f.diemDi} → ${f.diemDen}`, label:`${f.hangVe} · ${Number(f.giaVe).toLocaleString('vi-VN')} đ` })))
        } else if (providerScope === 'HOTEL') {
          const hotels = await hotelApi.mine()
          if (active) setScopeOptions(hotels.flatMap(h => h.danhSachPhong.map(r => ({ id:r.id, group:h.tenKhachSan, label:r.tenLoaiPhong }))))
        } else {
          const attractions = await attractionApi.mine()
          if (active) setScopeOptions(attractions.flatMap(a => a.danhSachLoaiVe.map(t => ({ id:t.id, group:a.tenDiaDiem, label:`${t.tenLoaiVe} · ${t.doiTuongApDung}` }))))
        }
      } catch { if (active) setScopeOptions([]) }
    }
    load(); return () => { active = false }
  }, [providerScope, session?.vaiTro])

  useEffect(() => {
    if (providerScope !== 'FLIGHT' || !selectedParent) { setFlightFares([]); setSelectedChild(''); return }
    flightApi.inventory(Number(selectedParent)).then(x => setFlightFares(x.fares.map(f => ({id:f.id,hangVe:f.hangVe})))).catch(() => setFlightFares([]))
  }, [providerScope, selectedParent])

  const set = (key: keyof FormState, value: string) => setForm(previous => ({ ...previous, [key]: value }))
  const validate = () => {
    const next: Record<string, string> = {}
    const todayValue = new Date().toISOString().slice(0, 10)
    const name = form.name.trim()
    const description = form.description.trim()
    if (name.length < 3 || name.length > 150) next.name = 'Tên ưu đãi phải từ 3 đến 150 ký tự.'
    if (!form.code.trim()) next.code = 'Hệ thống chưa tạo được mã ưu đãi. Vui lòng tải lại trang.'
    if (description.length > 500) next.description = 'Mô tả tối đa 500 ký tự.'
    const value = Number(form.discountValue)
    if (!(value > 0) || (form.discountType === 'PERCENTAGE' && value > 100)) next.discountValue = form.discountType === 'PERCENTAGE' ? 'Phần trăm giảm phải > 0 và <= 100.' : 'Số tiền giảm phải > 0.'
    const minimum = Number(form.minOrderAmount || 0)
    if (!Number.isFinite(minimum) || minimum < 0) next.minOrderAmount = 'Giá trị đơn tối thiểu phải >= 0.'
    if (form.maxDiscountAmount && Number(form.maxDiscountAmount) <= 0) next.maxDiscountAmount = 'Mức giảm tối đa phải > 0.'
    if (!form.startDate || (!editing && form.startDate < todayValue)) next.startDate = 'Ngày bắt đầu không được ở trong quá khứ.'
    if (!form.endDate || form.endDate <= form.startDate) next.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
    const maxUsage = Number(form.maxUsage)
    const perCustomer = Number(form.perCustomerLimit)
    if (!Number.isInteger(maxUsage) || maxUsage <= 0) next.maxUsage = 'Số lượt sử dụng tối đa phải là số nguyên > 0.'
    if (!Number.isInteger(perCustomer) || perCustomer <= 0) next.perCustomerLimit = 'Giới hạn mỗi khách hàng phải là số nguyên > 0.'
    if (Number.isInteger(maxUsage) && Number.isInteger(perCustomer) && perCustomer > maxUsage) next.perCustomerLimit = 'Giới hạn mỗi khách không được lớn hơn tổng lượt sử dụng.'
    if (!applyAll && !selectedParent) next.serviceIds = providerScope === 'FLIGHT' ? 'Vui lòng chọn chuyến bay hoặc chọn áp dụng cho tất cả chuyến bay.' : providerScope === 'HOTEL' ? 'Vui lòng chọn khách sạn/phòng hoặc áp dụng cho tất cả.' : 'Vui lòng chọn địa điểm hoặc áp dụng cho tất cả.'
    if (!applyAll && providerScope === 'FLIGHT' && selectedParent && !selectedChild) next.serviceIds = 'Vui lòng chọn hạng vé.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setBusy(true); setFatal('')
    const body = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      imageUrl: form.imageUrl || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.discountType === 'PERCENTAGE' && form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined,
      maxUsagePerCustomer: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
      serviceType: form.scope,
      serviceIds: applyAll ? Array.from(new Set(scopeOptions.map(x => x.id))) : providerScope === 'FLIGHT' && selectedChild ? [Number(selectedChild)] : selectedParent ? [Number(selectedParent)] : form.serviceIds,
    }
    try {
      if (editing) {
        await promotionApi.update(Number(id), body)
      } else {
        await promotionApi.create(body)
      }
      navigate('/provider/promotions', {
        replace: true,
        state: { success: editing ? 'Cập nhật ưu đãi thành công.' : 'Tạo ưu đãi thành công.' },
      })
    } catch (e) { setFatal(apiError(e)) } finally { setBusy(false) }
  }

  if (loading) return <div className="provider-promotions-page"><div className="promotion-admin-empty">Đang tải ưu đãi từ Promotion Service...</div></div>
  if (fatal && editing && !form.name) return <div className="provider-promotions-page"><div className="promotion-admin-empty">{fatal}</div></div>

  return <div className="provider-promotion-form-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/promotions">Quản lý ưu đãi</Link><span>›</span><strong>{editing ? 'Cập nhật ưu đãi' : 'Tạo ưu đãi mới'}</strong></div>
    <div className="promotion-form-title"><h1>{editing ? 'Cập nhật ưu đãi' : 'Tạo ưu đãi mới'}</h1><p>{editing ? 'Chỉnh sửa thông tin chương trình ưu đãi.' : 'Nhập thông tin để tạo chương trình ưu đãi mới.'}</p></div>
    {fatal && <div className="form-alert">{fatal}</div>}
    <form className="promotion-form-card" onSubmit={submit}>
      <section><h2><Tag/>1. Thông tin cơ bản</h2><div className="promotion-form-grid"><label>Tên ưu đãi <b>*</b><input value={form.name} onChange={event => set('name', event.target.value)} placeholder="Nhập tên ưu đãi"/><small className="promotion-field-error">{errors.name}</small></label><label>Mã ưu đãi <b>*</b><input value={form.code} readOnly placeholder="Hệ thống tự tạo"/><small>Mã được hệ thống tạo tự động và đảm bảo không trùng.</small><small className="promotion-field-error">{errors.code}</small></label><label className="span-2">Mô tả<textarea rows={4} value={form.description} onChange={event => set('description', event.target.value)} placeholder="Mô tả ưu đãi..."/><small className="promotion-counter">{form.description.length}/500</small><small className="promotion-field-error">{errors.description}</small></label></div></section>
      <section><h2><ImagePlus/>2. Hình ảnh ưu đãi</h2><div className="promotion-image-upload"><label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>3*1024*1024){setFatal('Ảnh ưu đãi tối đa 3MB.');return}const reader=new FileReader();reader.onload=()=>set('imageUrl',String(reader.result||''));reader.readAsDataURL(file)}}/><ImagePlus/><b>{form.imageUrl?'Thay ảnh ưu đãi':'Đính kèm ảnh ưu đãi'}</b><span>JPG, PNG, WEBP · tối đa 3MB</span></label>{form.imageUrl&&<div className="promotion-image-preview"><img src={form.imageUrl} alt="Ảnh ưu đãi"/><button type="button" onClick={()=>set('imageUrl','')}>Xóa ảnh</button></div>}</div></section>
      <section><h2><TicketPercent/>3. Loại giảm giá</h2><div className="promotion-form-choice"><button type="button" className={form.discountType === 'PERCENTAGE' ? 'active' : ''} onClick={() => set('discountType', 'PERCENTAGE')}><span>{form.discountType === 'PERCENTAGE' && <Check/>}</span>Phần trăm (%)</button><button type="button" className={form.discountType === 'FIXED_AMOUNT' ? 'active' : ''} onClick={() => set('discountType', 'FIXED_AMOUNT')}><span>{form.discountType === 'FIXED_AMOUNT' && <Check/>}</span>Số tiền cố định (VNĐ)</button></div><div className="promotion-form-grid"><label>Giá trị giảm <b>*</b><div className="promotion-input-suffix"><input type="number" min="0" value={form.discountValue} onChange={event => set('discountValue', event.target.value)} placeholder="Nhập giá trị"/><span>{form.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}</span></div><small className="promotion-field-error">{errors.discountValue}</small></label><label>Giá trị đơn hàng tối thiểu<div className="promotion-input-suffix"><input type="number" min="0" value={form.minOrderAmount} onChange={event => set('minOrderAmount', event.target.value)}/><span>VNĐ</span></div><small className="promotion-field-error">{errors.minOrderAmount}</small></label>{form.discountType === 'PERCENTAGE' && <label>Mức giảm tối đa<div className="promotion-input-suffix"><input type="number" min="0" value={form.maxDiscountAmount} onChange={event => set('maxDiscountAmount', event.target.value)} placeholder="Không giới hạn"/><span>VNĐ</span></div><small className="promotion-field-error">{errors.maxDiscountAmount}</small></label>}</div></section>
      <section><h2><CalendarDays/>4. Thời gian áp dụng</h2><div className="promotion-form-grid"><label>Ngày bắt đầu <b>*</b><input type="date" min={new Date().toISOString().slice(0, 10)} value={form.startDate} onChange={event => set('startDate', event.target.value)}/><small className="promotion-field-error">{errors.startDate}</small></label><label>Ngày kết thúc <b>*</b><input type="date" min={form.startDate || new Date().toISOString().slice(0, 10)} value={form.endDate} onChange={event => set('endDate', event.target.value)}/><small className="promotion-field-error">{errors.endDate}</small></label></div></section>
      <section><h2><CircleDollarSign/>5. Giới hạn sử dụng</h2><div className="promotion-form-grid"><label>Số lượt sử dụng tối đa<input type="number" min="1" value={form.maxUsage} onChange={event => set('maxUsage', event.target.value)}/><small className="promotion-field-error">{errors.maxUsage}</small></label><label>Số lượt sử dụng tối đa mỗi khách hàng<input type="number" min="1" value={form.perCustomerLimit} onChange={event => set('perCustomerLimit', event.target.value)}/><small className="promotion-field-error">{errors.perCustomerLimit}</small></label></div></section>
      <section><h2><TicketPercent/>6. Phạm vi áp dụng ưu đãi</h2>
        <label className="promotion-apply-all"><input type="checkbox" checked={applyAll} onChange={e=>{const checked=e.target.checked;setApplyAll(checked);if(checked){setSelectedParent('');setSelectedChild('');setForm(p=>({...p,serviceIds:Array.from(new Set(scopeOptions.map(x=>x.id)))}))}else setForm(p=>({...p,serviceIds:[]}))}}/><span>{providerScope === 'FLIGHT' ? 'Áp dụng cho tất cả chuyến bay' : providerScope === 'HOTEL' ? 'Áp dụng cho tất cả khách sạn / phòng' : 'Áp dụng cho tất cả địa điểm / loại vé'}</span></label>
        <div className="promotion-form-grid">
          {providerScope === 'FLIGHT' ? <>
            <label>Chuyến bay <b>*</b><select value={selectedParent} disabled={applyAll} onChange={e=>{setSelectedParent(e.target.value);setSelectedChild('');setForm(p=>({...p,serviceIds:e.target.value?[Number(e.target.value)]:[]}))}}><option value="">Chọn chuyến bay</option>{Array.from(new Map(scopeOptions.map(x=>[x.group.split(':')[0],x])).values()).map(x=><option key={x.group} value={x.id}>{x.group}</option>)}</select><small>Chỉ hiển thị chuyến bay thuộc hãng đang đăng nhập.</small></label>
            <label>Hạng vé <b>*</b><select value={selectedChild} disabled={applyAll || !selectedParent} onChange={e=>setSelectedChild(e.target.value)}><option value="">{selectedParent?'Chọn hạng vé':'Vui lòng chọn chuyến bay trước'}</option>{flightFares.map(f=><option key={f.id} value={f.hangVe}>{f.hangVe}</option>)}</select><small>Hạng vé được tải theo chuyến bay đã chọn.</small></label>
          </> : providerScope === 'HOTEL' ? <>
            <label>Khách sạn / phòng <b>*</b><select value={selectedParent} disabled={applyAll} onChange={e=>{setSelectedParent(e.target.value);setForm(p=>({...p,serviceIds:e.target.value?[Number(e.target.value)]:[]}))}}><option value="">Chọn khách sạn / phòng</option>{scopeOptions.map(x=><option key={x.id} value={x.id}>{x.group} — {x.label}</option>)}</select><small>Chỉ hiển thị dữ liệu của nhà cung cấp đang đăng nhập.</small></label>
            <label>Hạng phòng <b>*</b><input readOnly value={scopeOptions.find(x=>String(x.id)===selectedParent)?.label||''} placeholder="Chọn phòng để xác định hạng phòng"/></label>
          </> : <>
            <label>Địa điểm <b>*</b><select value={selectedParent} disabled={applyAll} onChange={e=>{setSelectedParent(e.target.value);setForm(p=>({...p,serviceIds:e.target.value?[Number(e.target.value)]:[]}))}}><option value="">Chọn địa điểm / loại vé</option>{scopeOptions.map(x=><option key={x.id} value={x.id}>{x.group} — {x.label}</option>)}</select><small>Chỉ hiển thị địa điểm của nhà cung cấp đang đăng nhập.</small></label>
            <label>Loại vé <b>*</b><input readOnly value={scopeOptions.find(x=>String(x.id)===selectedParent)?.label||''} placeholder="Chọn địa điểm để xác định loại vé"/></label>
          </>}
          <small className="promotion-field-error span-2">{errors.serviceIds}</small>
        </div>
      </section>
      <div className="promotion-form-actions"><Link to="/provider/promotions"><ArrowLeft/>Hủy</Link><button type="submit" disabled={busy}><Save/>{busy ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo ưu đãi'}</button></div>
    </form>
  </div>
}
