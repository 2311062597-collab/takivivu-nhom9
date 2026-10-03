import { CalendarDays, ChevronLeft, Clock3, Plane, Save } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { flightApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { FlightRequest } from '../../types'
import { apiError } from '../../utils/format'
import { Loading } from '../../components/UI'

const blank: FlightRequest = {
  maChuyenBay: '',
  hangHangKhong: '',
  diemDi: '',
  diemDen: '',
  sanBayDi: '',
  sanBayDen: '',
  thoiGianKhoiHanh: '',
  thoiGianDen: '',
  hangVe: 'Phổ thông',
  giaVe: 0,
  tongSoGhe: 180,
  hangVes: [
    { hangVe: 'Thương gia', giaVe: 0, soGhe: 20 },
    { hangVe: 'Phổ thông đặc biệt', giaVe: 0, soGhe: 30 },
    { hangVe: 'Phổ thông', giaVe: 0, soGhe: 130 },
  ],
}

const airports = [
  { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài (Hà Nội)' },
  { code: 'SGN', city: 'TP. Hồ Chí Minh', name: 'Tân Sơn Nhất (TP. Hồ Chí Minh)' },
  { code: 'DAD', city: 'Đà Nẵng', name: 'Đà Nẵng' },
  { code: 'PQC', city: 'Phú Quốc', name: 'Phú Quốc' },
  { code: 'CXR', city: 'Nha Trang', name: 'Cam Ranh (Nha Trang)' },
]

function toLocalInput(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.slice(0,16)
  const pad = (n:number)=>String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datePart(value:string){ return value ? value.slice(0,10) : '' }
function timePart(value:string){ return value ? value.slice(11,16) : '' }
function mergeDateTime(current:string, date?:string, time?:string){
  const d = date ?? datePart(current)
  const t = time ?? timePart(current)
  return d && t ? `${d}T${t}` : d ? `${d}T00:00` : ''
}

function generateFlightCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 5)
  return `TKV${stamp}${random}`
}

function providerBusinessName(providerId?: number, fallback?: string) {
  try {
    const raw = localStorage.getItem(`takivivu:provider-profile:${providerId || 'local'}`)
    if (raw) {
      const parsed = JSON.parse(raw) as { businessName?: string; shortName?: string }
      if (parsed.businessName?.trim()) return parsed.businessName.trim()
      if (parsed.shortName?.trim()) return parsed.shortName.trim()
    }
  } catch {}
  return fallback?.trim() || ''
}

export default function ProviderFlightFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { session } = useAuth()
  const [form, setForm] = useState<FlightRequest>(blank)
  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    if (editing) return
    const airline = providerBusinessName(session?.id, session?.hoTen)
    setForm(previous => ({ ...previous, hangHangKhong: airline, maChuyenBay: previous.maChuyenBay || generateFlightCode() }))
  }, [editing, session?.hoTen, session?.id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([flightApi.detail(Number(id)), flightApi.inventory(Number(id))])
      .then(([f, inventory]) => {
        const fares = inventory.fares?.length
          ? inventory.fares.map(fare => ({
              hangVe: fare.hangVe,
              giaVe: Number(fare.giaVe),
              soGhe: Number(fare.soGhe),
            }))
          : [{ hangVe: f.hangVe || 'Phổ thông', giaVe: f.giaVe, soGhe: f.tongSoGhe }]

        setForm({
          maChuyenBay: f.maChuyenBay,
          hangHangKhong: f.hangHangKhong,
          diemDi: f.diemDi,
          diemDen: f.diemDen,
          sanBayDi: f.sanBayDi,
          sanBayDen: f.sanBayDen,
          thoiGianKhoiHanh: toLocalInput(f.thoiGianKhoiHanh),
          thoiGianDen: toLocalInput(f.thoiGianDen),
          hangVe: f.hangVe || fares[0]?.hangVe || 'Phổ thông',
          giaVe: f.giaVe || fares[0]?.giaVe || 0,
          tongSoGhe: f.tongSoGhe,
          hangVes: fares,
        })
      })
      .catch(e=>setError(apiError(e)))
      .finally(()=>setLoading(false))
  }, [id])

  const customFrom = useMemo(()=>form.sanBayDi && !airports.some(a=>a.code===form.sanBayDi),[form.sanBayDi])
  const customTo = useMemo(()=>form.sanBayDen && !airports.some(a=>a.code===form.sanBayDen),[form.sanBayDen])

  const validate = () => {
    const next: Record<string,string> = {}
    const now = new Date()
    if (!form.hangHangKhong.trim()) next.hangHangKhong = 'Tên hãng hàng không không được để trống.'
    if (!form.sanBayDi) next.sanBayDi = 'Vui lòng chọn sân bay đi.'
    if (!form.sanBayDen) next.sanBayDen = 'Vui lòng chọn sân bay đến.'
    if (form.sanBayDi && form.sanBayDi === form.sanBayDen) next.sanBayDen = 'Sân bay đến phải khác sân bay đi.'
    const depart = new Date(form.thoiGianKhoiHanh); const arrive = new Date(form.thoiGianDen)
    if (!form.thoiGianKhoiHanh || (!editing && depart <= now)) next.thoiGianKhoiHanh = 'Thời gian khởi hành phải ở tương lai.'
    if (!form.thoiGianDen || arrive <= depart) next.thoiGianDen = 'Thời gian đến phải sau thời gian khởi hành.'
    if (!Number.isInteger(form.tongSoGhe) || form.tongSoGhe <= 0) next.tongSoGhe = 'Tổng số ghế phải là số nguyên lớn hơn 0.'
    const fares = form.hangVes || []
    if (!fares.length) next.hangVes = 'Phải có ít nhất một hạng vé.'
    fares.forEach((fare,i)=>{ if (!(fare.giaVe > 0)) next[`farePrice${i}`] = 'Giá vé phải lớn hơn 0.'; if (!Number.isInteger(fare.soGhe) || fare.soGhe <= 0) next[`fareSeat${i}`] = 'Số ghế phải là số nguyên lớn hơn 0.' })
    const sum = fares.reduce((n,f)=>n+(Number(f.soGhe)||0),0)
    if (sum !== Number(form.tongSoGhe)) next.hangVes = `Tổng ghế các hạng (${sum}) phải bằng tổng số ghế (${form.tongSoGhe}).`
    setErrors(next); return Object.keys(next).length===0
  }

  const chooseAirport = (kind:'from'|'to', code:string) => {
    const airport = airports.find(a=>a.code===code)
    if (kind==='from') setForm({...form, sanBayDi:code, diemDi:airport?.city || form.diemDi})
    else setForm({...form, sanBayDen:code, diemDen:airport?.city || form.diemDen})
  }

  const submit = async (e:FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    setError('')
    try {
      const fares = form.hangVes || []
      const cheapest = fares.filter(f => Number(f.giaVe) > 0).sort((a,b) => Number(a.giaVe) - Number(b.giaVe))[0]
      const payload: FlightRequest = {
        ...form,
        hangHangKhong: providerBusinessName(session?.id, session?.hoTen) || form.hangHangKhong,
        maChuyenBay: form.maChuyenBay || generateFlightCode(),
        // Hai trường legacy này vẫn được backend validate trước khi xử lý hangVes.
        // Đồng bộ với hạng vé hợp lệ để không báo sai "Giá vé phải lớn hơn 0".
        hangVe: cheapest?.hangVe || form.hangVe,
        giaVe: Number(cheapest?.giaVe || form.giaVe),
      }
      if (editing && id) await flightApi.update(Number(id), payload)
      else await flightApi.create(payload)
      navigate('/provider/flights')
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Đang tải thông tin chuyến bay..."/>

  return (
    <div className="provider-flight-form-page">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/flights">Quản lý chuyến bay</Link><span>›</span><strong>{editing?'Sửa chuyến bay':'Thêm chuyến bay'}</strong></div>
      <section className="provider-v2-page-title-row flight-form-title"><div><h1>{editing?'Sửa chuyến bay':'Thêm chuyến bay'}</h1><p>{editing?'Cập nhật thông tin chuyến bay.':'Vui lòng nhập đầy đủ thông tin để tạo chuyến bay mới.'}</p></div></section>

      {error && <div className="flight-form-error">{error}</div>}

      <form className="provider-flight-form-card" onSubmit={submit}>
        <section className="flight-form-section">
          <h2><Plane/> <span>1. Thông tin chuyến bay</span></h2>
          <div className="flight-form-grid two">
            <label>Hãng hàng không <b>*</b>
              <input value={form.hangHangKhong} readOnly placeholder="Tên nhà cung cấp"/>
              <small>Tên hãng hàng không được lấy từ nhà cung cấp đang đăng nhập.</small>
              <small className="promotion-field-error">{errors.hangHangKhong}</small>
            </label>
            <label>Mã chuyến bay <b>*</b>
              <input value={form.maChuyenBay} readOnly placeholder="Đang tạo mã..."/>
              <small>{editing ? 'Mã chuyến bay được giữ cố định.' : 'Mã được hệ thống tự động tạo và đảm bảo không trùng.'}</small>
            </label>
          </div>
        </section>

        <section className="flight-form-section">
          <h2><Plane/> <span>2. Thông tin hành trình</span></h2>
          <div className="flight-form-grid two">
            <label>Sân bay đi <b>*</b>
              <select required value={form.sanBayDi} onChange={e=>chooseAirport('from',e.target.value)}><option value="">Chọn sân bay đi</option>{customFrom&&<option value={form.sanBayDi}>{form.sanBayDi} - {form.diemDi}</option>}{airports.map(a=><option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}</select><small className="promotion-field-error">{errors.sanBayDi}</small>
            </label>
            <label>Sân bay đến <b>*</b>
              <select required value={form.sanBayDen} onChange={e=>chooseAirport('to',e.target.value)}><option value="">Chọn sân bay đến</option>{customTo&&<option value={form.sanBayDen}>{form.sanBayDen} - {form.diemDen}</option>}{airports.map(a=><option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}</select><small className="promotion-field-error">{errors.sanBayDen}</small>
            </label>

            {!editing ? <>
              <label>Thời gian khởi hành <b>*</b><div className="flight-form-input-icon"><CalendarDays/><input type="datetime-local" required value={form.thoiGianKhoiHanh} onChange={e=>setForm({...form,thoiGianKhoiHanh:e.target.value})}/></div><small className="promotion-field-error">{errors.thoiGianKhoiHanh}</small></label>
              <label>Thời gian đến <b>*</b><div className="flight-form-input-icon"><CalendarDays/><input type="datetime-local" required value={form.thoiGianDen} onChange={e=>setForm({...form,thoiGianDen:e.target.value})}/></div><small className="promotion-field-error">{errors.thoiGianDen}</small></label>
            </> : <>
              <label>Thời gian khởi hành <b>*</b><div className="flight-datetime-split"><div className="flight-form-input-icon"><CalendarDays/><input type="date" required value={datePart(form.thoiGianKhoiHanh)} onChange={e=>setForm({...form,thoiGianKhoiHanh:mergeDateTime(form.thoiGianKhoiHanh,e.target.value,undefined)})}/></div><div className="flight-form-input-icon"><Clock3/><input type="time" required value={timePart(form.thoiGianKhoiHanh)} onChange={e=>setForm({...form,thoiGianKhoiHanh:mergeDateTime(form.thoiGianKhoiHanh,undefined,e.target.value)})}/></div></div></label>
              <label>Thời gian đến <b>*</b><div className="flight-datetime-split"><div className="flight-form-input-icon"><CalendarDays/><input type="date" required value={datePart(form.thoiGianDen)} onChange={e=>setForm({...form,thoiGianDen:mergeDateTime(form.thoiGianDen,e.target.value,undefined)})}/></div><div className="flight-form-input-icon"><Clock3/><input type="time" required value={timePart(form.thoiGianDen)} onChange={e=>setForm({...form,thoiGianDen:mergeDateTime(form.thoiGianDen,undefined,e.target.value)})}/></div></div></label>
            </>}
          </div>
        </section>

        <section className="flight-form-section">
          <h2><TicketIcon/> <span>3. Hạng vé và số ghế</span></h2>
          <div className="flight-form-grid two">
            <label>Tổng số ghế <b>*</b><input type="number" min={1} value={form.tongSoGhe || ''} onChange={e=>setForm({...form,tongSoGhe:Number(e.target.value)})} placeholder="VD: 180"/><small className="promotion-field-error">{errors.tongSoGhe}</small></label>
            <label>Sơ đồ ghế<small>Hệ thống tự sinh mã ghế 1A, 1B... theo tổng số ghế sau khi tạo chuyến bay.</small></label>
          </div>
          <div className="flight-fare-config">
            {(form.hangVes || []).map((fare,index)=><div className="flight-fare-row" key={fare.hangVe}>
              <strong>{fare.hangVe}</strong>
              <label>Giá vé (VND)<input type="number" min={1} value={fare.giaVe || ''} onChange={e=>{const list=[...(form.hangVes||[])];list[index]={...fare,giaVe:Number(e.target.value)};setForm({...form,hangVes:list})}}/><small className="promotion-field-error">{errors[`farePrice${index}`]}</small></label>
              <label>Số lượng ghế<input type="number" min={1} value={fare.soGhe || ''} onChange={e=>{const list=[...(form.hangVes||[])];list[index]={...fare,soGhe:Number(e.target.value)};setForm({...form,hangVes:list})}}/><small className="promotion-field-error">{errors[`fareSeat${index}`]}</small></label>
            </div>)}
            <small className="promotion-field-error">{errors.hangVes}</small>
          </div>
        </section>

        <div className="flight-form-actions">
          <button type="button" className="back" onClick={()=>navigate('/provider/flights')}><ChevronLeft/> Quay lại</button>
          <div>
            {editing && <button type="button" className="cancel" onClick={()=>navigate('/provider/flights')}>Hủy</button>}
            <button className="save" disabled={busy}>{editing?<Save/>:<Plane/>}{busy?'Đang lưu...':editing?'Lưu thay đổi':'Thêm chuyến bay'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

function TicketIcon(){return <span className="ticket-line-icon">🎫</span>}
