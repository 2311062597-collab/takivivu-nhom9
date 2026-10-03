import {
  CalendarDays,
  Image as ImageIcon,
  Save,
  Ticket as TicketIcon,
  Upload,
  X,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { attractionApi } from '../../api/services'
import type { Attraction, AttractionTicketCategory, TicketRequest, TicketType } from '../../types'
import { Loading } from '../../components/UI'
import { apiError, money } from '../../utils/format'
import { loadAttractionExtra } from './ProviderAttractionsPage'
import { loadTicketExtra, saveTicketExtra, type TicketExtra } from './ProviderTicketsPage'

const blank: TicketRequest = { maLoaiVe: '', moTa: '', giaVe: 0, tongSoVe: 1, ngayBatDau: '', ngayKetThuc: '' }
const today = () => { const d = new Date(); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10) }

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function defaultExtra(): TicketExtra {
  return {
    kind: '',
    audience: '',
    usageWindow: 'Trong ngày (08:00 - 22:00)',
    terms: 'Vé có giá trị sử dụng trong ngày, theo khung giờ hoạt động.\nVui lòng xuất trình vé (mã QR) khi vào cổng.\nĐiều kiện hủy/hoàn vé áp dụng theo đơn đặt dịch vụ.',
    images: [],
  }
}

export default function ProviderTicketFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const [places, setPlaces] = useState<Attraction[]>([])
  const [categories, setCategories] = useState<AttractionTicketCategory[]>([])
  const [ticket, setTicket] = useState<TicketType | null>(null)
  const [attractionId, setAttractionId] = useState('')
  const [form, setForm] = useState<TicketRequest>(blank)
  const [extra, setExtra] = useState<TicketExtra>(defaultExtra)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const [mine, catalog] = await Promise.all([attractionApi.mine(), attractionApi.ticketCategories()])
        if (!alive) return
        setPlaces(mine)
        setCategories(catalog)

        if (!editing) {
          const firstPlace = mine[0]
          setAttractionId(firstPlace ? String(firstPlace.id) : '')
          const used = new Set(firstPlace?.danhSachLoaiVe?.map(item => item.maLoaiVe) || [])
          const firstAvailable = catalog.find(item => !used.has(item.maLoaiVe)) || catalog[0]
          setForm(current => ({ ...current, maLoaiVe: firstAvailable?.maLoaiVe || '' }))
          if (firstPlace) {
            const images = loadAttractionExtra(firstPlace).images
            setExtra(current => ({ ...current, images: images.slice(0, 5), usageWindow: `Trong ngày (${firstPlace.gioMoCua || '08:00'} - ${firstPlace.gioDongCua || '22:00'})` }))
          }
          return
        }

        const current = await attractionApi.ticket(Number(id))
        if (!alive) return
        setTicket(current)
        setAttractionId(String(current.diaDiemId))
        setForm({ maLoaiVe: current.maLoaiVe, moTa: current.moTa || '', giaVe: current.giaVe, tongSoVe: current.tongSoVe, ngayBatDau: current.ngayBatDau || '', ngayKetThuc: current.ngayKetThuc || '' })
        const place = mine.find(item => item.id === current.diaDiemId)
        setExtra(loadTicketExtra(current, place))
      } catch (e) {
        if (alive) setError(apiError(e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [editing, id])

  const place = useMemo(() => places.find(item => item.id === Number(attractionId)), [places, attractionId])
  const availableCategories = useMemo(() => {
    if (!place) return categories
    const used = new Set((place.danhSachLoaiVe || []).filter(item => !editing || item.id !== ticket?.id).map(item => item.maLoaiVe))
    return categories.filter(item => !used.has(item.maLoaiVe))
  }, [categories, place, editing, ticket?.id])
  const selectedCategory = useMemo(
    () => categories.find(item => item.maLoaiVe === form.maLoaiVe) || null,
    [categories, form.maLoaiVe],
  )
  const previewImage = extra.images[0] || (place ? loadAttractionExtra(place).images[0] : '') || place?.hinhAnh || ''

  useEffect(() => {
    if (!selectedCategory) return
    setExtra(current => ({ ...current, kind: selectedCategory.tenLoaiVe, audience: selectedCategory.doiTuongApDung }))
  }, [selectedCategory?.maLoaiVe])

  useEffect(() => {
    if (!place || editing) return
    const images = loadAttractionExtra(place).images
    setExtra(current => ({ ...current, images: current.images.length ? current.images : images.slice(0, 5), usageWindow: `Trong ngày (${place.gioMoCua || '08:00'} - ${place.gioDongCua || '22:00'})` }))
    const used = new Set(place.danhSachLoaiVe?.map(item => item.maLoaiVe) || [])
    if (!form.maLoaiVe || used.has(form.maLoaiVe)) {
      const next = categories.find(item => !used.has(item.maLoaiVe))
      setForm(current => ({ ...current, maLoaiVe: next?.maLoaiVe || '' }))
    }
  }, [place?.id, editing, categories])

  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 5 - extra.images.length))
    if (!files.length) return
    try {
      const images = await Promise.all(files.map(readFile))
      setExtra(current => ({ ...current, images: [...current.images, ...images].slice(0, 5) }))
    } catch {
      setError('Không thể đọc ảnh đã chọn.')
    }
    event.target.value = ''
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!attractionId) return setError('Vui lòng chọn địa điểm tham quan.')
    if (!form.maLoaiVe) return setError('Địa điểm này đã có đủ 3 loại vé hoặc chưa tải được danh mục loại vé.')
    const description = form.moTa.trim()
    if (!description) return setError('Vui lòng nhập mô tả loại vé.')
    if (description.length > 500) return setError('Mô tả loại vé không được vượt quá 500 ký tự.')
    if (!Number.isFinite(Number(form.giaVe)) || Number(form.giaVe) <= 0) return setError('Giá vé phải lớn hơn 0.')
    if (Number(form.giaVe) > 1_000_000_000) return setError('Giá vé không được vượt quá 1.000.000.000 VND.')
    if (!Number.isInteger(Number(form.tongSoVe)) || Number(form.tongSoVe) <= 0) return setError('Số lượng vé phải là số nguyên lớn hơn 0.')
    if (Number(form.tongSoVe) > 1_000_000) return setError('Số lượng vé không được vượt quá 1.000.000.')
    if (!form.ngayBatDau || !form.ngayKetThuc) return setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.')
    if (form.ngayBatDau < today()) return setError('Ngày bắt đầu không được ở trong quá khứ.')
    if (form.ngayKetThuc < form.ngayBatDau) return setError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.')
    const payload = { ...form, moTa: description }
    setBusy(true)
    setError('')
    try {
      const saved = editing && ticket
        ? await attractionApi.updateTicket(Number(attractionId), ticket.id, payload)
        : await attractionApi.createTicket(Number(attractionId), payload)
      saveTicketExtra(saved.id, { ...extra, kind: saved.tenLoaiVe, audience: saved.doiTuongApDung })
      navigate('/provider/tickets')
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Đang tải thông tin vé..."/>

  return (
    <div className={`provider-ticket-form-page ${editing ? 'editing' : 'creating'}`}>
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/tickets">Quản lý vé</Link><span>›</span><strong>{editing ? 'Sửa vé' : 'Thêm loại vé'}</strong></div>
      {error && <div className="hotel-form-error">{error}</div>}

      {!editing ? (
        <form className="ticket-create-card" onSubmit={submit}>
          <h3><TicketIcon/> Thông tin loại vé</h3>
          <label className="ticket-span-2">Địa điểm tham quan <b>*</b><select required value={attractionId} onChange={e => setAttractionId(e.target.value)}><option value="">-- Chọn địa điểm tham quan --</option>{places.map(item => <option key={item.id} value={item.id}>{item.tenDiaDiem}</option>)}</select></label>
          <label className="ticket-paired-field"><span className="ticket-field-label">Loại vé <b>*</b></span><select required value={form.maLoaiVe} onChange={e => setForm({...form,maLoaiVe:e.target.value})}><option value="">-- Chọn loại vé --</option>{availableCategories.map(item => <option key={item.maLoaiVe} value={item.maLoaiVe}>{item.tenLoaiVe}</option>)}</select><small>Hệ thống chỉ cho phép 3 loại vé đã cấu hình trong CSDL.</small></label>
          <label className="ticket-paired-field"><span className="ticket-field-label">Đối tượng áp dụng <b className="ticket-required-placeholder">*</b></span><input readOnly value={selectedCategory?.doiTuongApDung || ''} placeholder="Tự động theo loại vé"/><small>Tự động lấy từ danh mục loại vé trong CSDL.</small></label>
          <label className="ticket-span-2 ticket-textarea">Mô tả <b>*</b><textarea required maxLength={500} value={form.moTa} onChange={e => setForm({...form,moTa:e.target.value})} placeholder="Nhập mô tả loại vé..."/><small>{form.moTa.length}/500</small></label>
          <label>Giá vé (VND) <b>*</b><input required type="number" min="1" max="1000000000" value={form.giaVe || ''} onChange={e => setForm({...form,giaVe:Number(e.target.value)})} placeholder="Nhập giá vé"/></label>
          <label>Số lượng vé <b>*</b><input required type="number" min="1" max="1000000" step="1" value={form.tongSoVe || ''} onChange={e => setForm({...form,tongSoVe:Number(e.target.value)})} placeholder="Nhập số lượng vé"/></label>
          <label>Ngày bắt đầu sử dụng <b>*</b><div className="ticket-date-input"><CalendarDays/><input required type="date" min={today()} value={form.ngayBatDau} onChange={e => setForm({...form,ngayBatDau:e.target.value})}/></div><small>Vé chỉ có hiệu lực trong khoảng thời gian này.</small></label>
          <label>Ngày kết thúc sử dụng <b>*</b><div className="ticket-date-input"><CalendarDays/><input required type="date" min={form.ngayBatDau || today()} value={form.ngayKetThuc} onChange={e => setForm({...form,ngayKetThuc:e.target.value})}/></div></label>
          <div className="ticket-form-footer ticket-span-2"><button type="button" className="ticket-secondary" onClick={() => navigate('/provider/tickets')}>Hủy</button><button className="ticket-primary" disabled={busy || !form.maLoaiVe}><Save/>{busy ? 'Đang lưu...' : 'Thêm loại vé'}</button></div>
        </form>
      ) : (
        <form className="ticket-edit-layout" onSubmit={submit}>
          <section className="ticket-edit-main">
            <h3><TicketIcon/> Thông tin vé</h3>
            <div className="ticket-edit-grid">
              <label>Địa điểm tham quan <b>*</b><select required disabled value={attractionId}>{places.map(item => <option key={item.id} value={item.id}>{item.tenDiaDiem}</option>)}</select><small>Không thể đổi địa điểm của vé đã tạo.</small></label>
              <label>Loại vé <b>*</b><select required value={form.maLoaiVe} onChange={e => setForm({...form,maLoaiVe:e.target.value})}>{availableCategories.map(item => <option key={item.maLoaiVe} value={item.maLoaiVe}>{item.tenLoaiVe}</option>)}</select><small>Chỉ 3 loại vé cố định trong CSDL.</small></label>
              <label className="ticket-span-2">Đối tượng áp dụng<input readOnly value={selectedCategory?.doiTuongApDung || ticket?.doiTuongApDung || ''}/><small>Được tự động xác định theo loại vé.</small></label>
              <label>Giá vé (VND) <b>*</b><input required type="number" min="1" max="1000000000" value={form.giaVe} onChange={e => setForm({...form,giaVe:Number(e.target.value)})}/></label>
              <label>Số lượng vé <b>*</b><input required type="number" min="1" max="1000000" step="1" value={form.tongSoVe} onChange={e => setForm({...form,tongSoVe:Number(e.target.value)})}/></label>
              <label>Ngày bắt đầu sử dụng <b>*</b><div className="ticket-date-input"><CalendarDays/><input required type="date" min={today()} value={form.ngayBatDau} onChange={e => setForm({...form,ngayBatDau:e.target.value})}/></div></label>
              <label>Ngày kết thúc sử dụng <b>*</b><div className="ticket-date-input"><CalendarDays/><input required type="date" min={form.ngayBatDau || today()} value={form.ngayKetThuc} onChange={e => setForm({...form,ngayKetThuc:e.target.value})}/></div></label>
              <label className="ticket-span-2 ticket-textarea">Mô tả <b>*</b><textarea required maxLength={500} value={form.moTa} onChange={e => setForm({...form,moTa:e.target.value})}/><small>{form.moTa.length}/500</small></label>
              <label className="ticket-span-2 ticket-textarea">Điều kiện sử dụng<textarea value={extra.terms} maxLength={1000} onChange={e => setExtra({...extra,terms:e.target.value})}/><small>{extra.terms.length}/1000</small></label>
            </div>
          </section>

          <aside className="ticket-edit-side">
            <div className="ticket-image-title"><h3><ImageIcon/> Hình ảnh vé</h3><label><Upload/> Thay đổi ảnh<input type="file" accept="image/jpeg,image/png" multiple onChange={addImages}/></label></div>
            <div className="ticket-edit-hero">{previewImage ? <img src={previewImage} alt=""/> : <div className="ticket-hero-fallback"><span/><i/><b/></div>}</div>
            <div className="ticket-edit-thumbs">{extra.images.slice(0,4).map((src,index)=><div key={`${src.slice(0,20)}-${index}`}><img src={src} alt=""/><button type="button" onClick={()=>setExtra(current=>({...current,images:current.images.filter((_,i)=>i!==index)}))}><X/></button></div>)}{extra.images.length < 5 && <label className="ticket-add-image"><PlusIcon/> <span>Thêm ảnh</span><input type="file" accept="image/jpeg,image/png" multiple onChange={addImages}/></label>}</div>
            <small className="ticket-image-note">Hỗ trợ JPG, PNG (tối đa 5MB/ảnh). Bạn có thể thêm tối đa 5 ảnh.</small>
            <div className="ticket-preview-card"><div><h3>Thông tin xem trước</h3><button type="button" onClick={() => ticket && navigate(`/provider/tickets/${ticket.id}`)}>Xem chi tiết</button></div><section><div className="ticket-preview-thumb">{previewImage ? <img src={previewImage} alt=""/> : <span/>}</div><div><strong>{selectedCategory?.tenLoaiVe || ticket?.tenLoaiVe || 'Loại vé'}</strong><em>{selectedCategory?.doiTuongApDung || ticket?.doiTuongApDung || ''}</em><small>⌖ {place?.tenDiaDiem || 'Địa điểm'}</small><b>{money(form.giaVe)}</b></div></section><footer><span>▣ {extra.usageWindow}</span><span>⌁ Còn {ticket?.soVeConLai ?? form.tongSoVe} vé</span></footer></div>
          </aside>

          <div className="ticket-edit-footer"><button type="button" className="ticket-secondary" onClick={() => navigate('/provider/tickets')}>Hủy</button><button className="ticket-primary" disabled={busy || !form.maLoaiVe}><Save/>{busy ? 'Đang lưu...' : 'Cập nhật vé'}</button></div>
        </form>
      )}
    </div>
  )
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
