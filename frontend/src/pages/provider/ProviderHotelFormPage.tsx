import { GoogleMapAddressPreview } from '../../components/GoogleMap'
import {
  ChevronLeft,
  Crosshair,
  Hotel as HotelIcon,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  Star,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { hotelApi } from '../../api/services'
import type { HotelRequest } from '../../types'
import { apiError } from '../../utils/format'
import { Loading } from '../../components/UI'

const blank: HotelRequest = {
  tenKhachSan: '',
  moTa: '',
  diaChi: '',
  thanhPho: '',
  viDo: 0,
  kinhDo: 0,
  soSao: 5,
  soTang: 0,
  soDienThoai: '',
  email: '',
  hinhAnh: '',
  quanHuyen: '',
  tienNghi: '',
  anhGioiThieu: '',
}

const cities = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Nha Trang','Phú Quốc','Quy Nhơn','Hạ Long','Hội An','Vũng Tàu','Đà Lạt']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

interface ExtraFields {
  brand: string
  district: string
}

const extraBlank: ExtraFields = { brand:'', district:'' }

function metadataKey(id:number){ return `takivivu.hotel.extra.${id}` }

function loadMetadata(id:number):ExtraFields {
  try {
    const raw = localStorage.getItem(metadataKey(id))
    return raw ? { ...extraBlank, ...JSON.parse(raw) } : extraBlank
  } catch { return extraBlank }
}

function saveMetadata(id:number, extra:ExtraFields){
  try { localStorage.setItem(metadataKey(id), JSON.stringify(extra)) } catch { /* localStorage may be unavailable */ }
}

function normalizedText(value?: string) {
  return (value || '').trim().replace(/\s+/g, ' ')
}

export default function ProviderHotelFormPage({ profileMode = false }: { profileMode?: boolean }) {
  const { id } = useParams()
  const editing = Boolean(id) || profileMode
  const [hotelId, setHotelId] = useState<number | null>(id ? Number(id) : null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form,setForm] = useState<HotelRequest>(blank)
  const [extra,setExtra] = useState<ExtraFields>(extraBlank)
  const [files,setFiles] = useState<File[]>([])
  const [loading,setLoading] = useState(editing)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')

  useEffect(()=>{
    if (!profileMode) return
    setLoading(true)
    hotelApi.mine().then(hotels => {
      const h = hotels[0]
      if (!h) return
      setHotelId(h.id)
      setForm({tenKhachSan:h.tenKhachSan,moTa:h.moTa||'',diaChi:h.diaChi,thanhPho:h.thanhPho,soDienThoai:h.soDienThoai||'',email:h.email||'',hinhAnh:h.hinhAnh||'',viDo:h.viDo||0,kinhDo:h.kinhDo||0,soSao:h.soSao||1,soTang:h.soTang||0,quanHuyen:h.quanHuyen||'',tienNghi:h.tienNghi||'',anhGioiThieu:h.anhGioiThieu||''})
    }).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))
  },[profileMode])

  useEffect(()=>{
    if(!id || profileMode) return
    setLoading(true)
    hotelApi.detail(Number(id)).then(h=>{
      setForm({tenKhachSan:h.tenKhachSan,moTa:h.moTa||'',diaChi:h.diaChi,thanhPho:h.thanhPho,soDienThoai:h.soDienThoai||'',email:h.email||'',hinhAnh:h.hinhAnh||'',viDo:h.viDo||0,kinhDo:h.kinhDo||0,soSao:h.soSao||1,soTang:h.soTang||0,quanHuyen:h.quanHuyen||'',tienNghi:h.tienNghi||'',anhGioiThieu:h.anhGioiThieu||''})
      setExtra(loadMetadata(Number(id)))
    }).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))
  },[id])

  const previews = useMemo(()=>files.map(file=>({file,url:URL.createObjectURL(file)})),[files])
  useEffect(()=>()=>previews.forEach(p=>URL.revokeObjectURL(p.url)),[previews])

  const setField = <K extends keyof HotelRequest>(key:K,value:HotelRequest[K]) => setForm(f=>({...f,[key]:value,...(['diaChi','thanhPho','quanHuyen'].includes(key)?{viDo:0,kinhDo:0,placeId:undefined}:{})}))

  const addFiles = (event:ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    const wrongType = selected.find(file=>!['image/jpeg','image/png','image/webp'].includes(file.type))
    const tooLarge = selected.find(file=>file.size > MAX_IMAGE_SIZE)
    if(wrongType){
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.')
      event.target.value=''
      return
    }
    if(tooLarge){
      setError(`Ảnh ${tooLarge.name} vượt quá 5MB.`)
      event.target.value=''
      return
    }
    setError('')
    setFiles(current=>[...current,...selected].slice(0,5))
    event.target.value=''
  }

  const validate = () => {
    if(!normalizedText(form.tenKhachSan)) return 'Vui lòng nhập tên khách sạn.'
    if(!normalizedText(form.diaChi)) return 'Vui lòng nhập địa chỉ khách sạn.'
    if(!normalizedText(form.thanhPho)) return 'Vui lòng chọn thành phố/khu vực.'
    if(!normalizedText(form.quanHuyen)) return 'Vui lòng nhập quận/huyện.'
    if(!normalizedText(form.tienNghi)) return 'Vui lòng nhập tiện nghi khách sạn.'
    if(!form.hinhAnh && !files[0]) return 'Vui lòng tải ảnh đại diện khách sạn.'
    if(!form.anhGioiThieu) return 'Vui lòng tải ảnh giới thiệu khách sạn.'
    if(!normalizedText(form.moTa)) return 'Vui lòng nhập mô tả khách sạn.'
    if(!normalizedText(form.soDienThoai)) return 'Vui lòng nhập số điện thoại.'
    if(!/^\+?[0-9\s().-]{8,20}$/.test(normalizedText(form.soDienThoai))) return 'Số điện thoại chưa đúng định dạng.'
    const email = normalizedText(form.email).toLowerCase()
    if(!email) return 'Vui lòng nhập email.'
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email chưa đúng định dạng.'
    if(!Number.isInteger(form.soTang) || form.soTang < 1) return 'Số tầng phải là số nguyên lớn hơn 0.'
    if(form.soSao < 1 || form.soSao > 5) return 'Hạng sao phải từ 1 đến 5.'
    if(!Number.isFinite(Number(form.viDo)) || Number(form.viDo) < -90 || Number(form.viDo) > 90) return 'Vĩ độ phải nằm trong khoảng -90 đến 90.'
    if(!Number.isFinite(Number(form.kinhDo)) || Number(form.kinhDo) < -180 || Number(form.kinhDo) > 180) return 'Kinh độ phải nằm trong khoảng -180 đến 180.'
    return ''
  }

  const submit = async (event:FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if(validationError){
      setError(validationError)
      window.scrollTo({top:0,behavior:'smooth'})
      return
    }

    setBusy(true)
    setError('')
    try {
      let payload: HotelRequest = {
        ...form,
        tenKhachSan: normalizedText(form.tenKhachSan),
        moTa: normalizedText(form.moTa),
        diaChi: normalizedText(form.diaChi),
        thanhPho: normalizedText(form.thanhPho),
        soDienThoai: normalizedText(form.soDienThoai),
        email: normalizedText(form.email).toLowerCase(),
      }

      if(files[0]){
        const uploaded = await hotelApi.uploadImage(files[0])
        payload = { ...payload, hinhAnh: uploaded.url }
      }

      if(editing && (hotelId || id)){
        await hotelApi.update(Number(hotelId || id),payload)
        saveMetadata(Number(hotelId || id),extra)
      } else {
        const created = await hotelApi.create(payload)
        saveMetadata(created.id,extra)
      }
      navigate(profileMode ? '/provider/profile?saved=1' : '/provider/hotels')
    } catch(e){
      setError(apiError(e))
      window.scrollTo({top:0,behavior:'smooth'})
    } finally {
      setBusy(false)
    }
  }


  if(loading) return <Loading label="Đang tải thông tin khách sạn..."/>

  return <div className="provider-hotel-form-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>{profileMode ? 'Hồ sơ khách sạn' : editing ? 'Sửa khách sạn' : 'Thêm khách sạn'}</strong></div>
    <section className="provider-hotel-form-heading"><h1>{profileMode ? 'Hồ sơ khách sạn' : editing?'Sửa khách sạn':'Thêm khách sạn'}</h1><p>{profileMode ? 'Hoàn thiện hồ sơ khách sạn trước khi sử dụng các chức năng kinh doanh.' : editing?'Cập nhật thông tin khách sạn.':'Vui lòng nhập đầy đủ thông tin để tạo khách sạn mới.'}</p></section>

    {searchParams.get('saved') === '1' && <div role="status" className="provider-profile-success">Đã lưu hồ sơ khách sạn thành công.</div>}
    {error && <div className="hotel-form-error">{error}</div>}

    <form className="provider-hotel-form-card" onSubmit={submit} noValidate>
      <section className="hotel-form-section">
        <h2><HotelIcon/> <span>1. Thông tin cơ bản</span></h2>
        <div className="hotel-form-basic-grid">
          <label className="hotel-name-field">Tên khách sạn <b>*</b><input maxLength={255} value={form.tenKhachSan} onChange={e=>setField('tenKhachSan',e.target.value)} placeholder="Nhập tên khách sạn"/><small>{form.tenKhachSan.length}/255</small></label>
          {editing ? null : <>
            <label>Địa chỉ <b>*</b><div className="hotel-input-icon"><MapPin/><input value={form.diaChi} onChange={e=>setField('diaChi',e.target.value)} placeholder="Nhập số nhà, đường, phường/xã"/></div></label>
            <label>Thành phố/Khu vực <b>*</b><select value={form.thanhPho} onChange={e=>setField('thanhPho',e.target.value)}><option value="">Chọn thành phố/khu vực</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label>
          </>}

          <label className={editing?'hotel-description-field edit':'hotel-description-field'}>Mô tả <b>*</b><textarea maxLength={1000} rows={editing?3:4} value={form.moTa} onChange={e=>setField('moTa',e.target.value)} placeholder="Nhập mô tả khách sạn"/><small>{form.moTa.length}/1000</small></label>

          <label>Số điện thoại <b>*</b><div className="hotel-input-icon"><Phone/><input value={form.soDienThoai||''} onChange={e=>setField('soDienThoai',e.target.value)} placeholder="Nhập số điện thoại"/></div></label>
          <label>Email <b>*</b><div className="hotel-input-icon"><Mail/><input type="email" value={form.email||''} onChange={e=>setField('email',e.target.value)} placeholder="Nhập email"/></div></label>

          <label>Số tầng khách sạn <b>*</b><input type="number" required min={1} step={1} value={form.soTang||''} onChange={e=>setField('soTang',Number(e.target.value))} placeholder="Nhập tổng số tầng" /></label>
          <div className="hotel-star-field"><span>Hạng sao <b>*</b></span><div>{[1,2,3,4,5].map(star=><button type="button" key={star} className={star<=form.soSao?'active':''} onClick={()=>setField('soSao',star)} aria-label={`${star} sao`}><Star/></button>)}</div></div>
        </div>
      </section>

      <section className="hotel-form-section hotel-location-section">
        <h2><MapPin/> <span>2. {editing?'Địa chỉ và vị trí':'Vị trí trên bản đồ'}</span></h2>
        {editing && <div className="hotel-form-address-row">
          <label>Địa chỉ <b>*</b><input value={form.diaChi} onChange={e=>setField('diaChi',e.target.value)} placeholder="Số 1 Đường Bà Triệu, Hoàn Kiếm"/></label>
          <label>Tỉnh/Thành phố <b>*</b><select value={form.thanhPho} onChange={e=>setField('thanhPho',e.target.value)}><option value="">Chọn tỉnh/thành phố</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label>
          <label>Quận/Huyện <b>*</b><input required value={form.quanHuyen} onChange={e=>setField('quanHuyen',e.target.value)} placeholder="Nhập quận/huyện"/></label>
        </div>}
        {!editing && <label>Quận/Huyện <b>*</b><input required value={form.quanHuyen} onChange={e=>setField('quanHuyen',e.target.value)}/></label>}
        <div className="hotel-map-grid">
          <label>Vĩ độ (Latitude)<div className="hotel-coordinate-input"><input type="number" min="-90" max="90" step="any" value={form.viDo || ''} onChange={e=>setField('viDo',e.target.value === '' ? 0 : Number(e.target.value))} placeholder="Nhập vĩ độ"/><Crosshair/></div></label>
          <label>Kinh độ (Longitude)<div className="hotel-coordinate-input"><input type="number" min="-180" max="180" step="any" value={form.kinhDo || ''} onChange={e=>setField('kinhDo',e.target.value === '' ? 0 : Number(e.target.value))} placeholder="Nhập kinh độ"/><Crosshair/></div></label>
          <div className="hotel-map-preview-wrap"><span>Xem trước vị trí</span><div className="hotel-map-preview real-map" style={{height:260}}>
            <GoogleMapAddressPreview latitude={form.viDo} longitude={form.kinhDo} address={[form.diaChi, form.quanHuyen, form.thanhPho].filter(Boolean).join(', ')} title="Vị trí khách sạn" />
          </div><small className="hotel-map-message">Nhập địa chỉ thủ công. Tọa độ là tùy chọn; bản đồ không tự điền thông tin vào biểu mẫu.</small></div>
        </div>
      </section>

      <section className="hotel-form-section"><h2><HotelIcon/> Tiện nghi khách sạn</h2><label>Tiện nghi <b>*</b><textarea required value={form.tienNghi} onChange={e=>setField('tienNghi',e.target.value)} placeholder="Ví dụ: Wi-Fi, hồ bơi, bãi đỗ xe"/></label></section>
      <section className="hotel-form-section hotel-images-section">
        <h2><ImageIcon/> <span>3. Hình ảnh</span></h2>
        <label className="hotel-image-label">Tải lên hình ảnh khách sạn (tối đa 5 ảnh, ảnh đầu tiên là ảnh đại diện)</label>
        <div className="hotel-upload-row">
          {editing && form.hinhAnh && previews.length === 0 && <div className="hotel-main-image-placeholder"><img src={form.hinhAnh} alt="Ảnh khách sạn hiện tại"/><button type="button" onClick={()=>setField('hinhAnh','')}><X/></button></div>}
          <label className="hotel-upload-drop"><UploadCloud/><div><strong>Kéo thả ảnh vào đây hoặc nhấp để chọn</strong><small>JPG, PNG, WEBP · tối đa 5MB/ảnh</small></div><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addFiles}/></label>
          {previews.map((preview,index)=><div className="hotel-upload-preview" key={`${preview.file.name}-${index}`}><img src={preview.url} alt={preview.file.name}/><button type="button" onClick={()=>setFiles(list=>list.filter((_,i)=>i!==index))}><X/></button></div>)}
          {Array.from({length:Math.max(0,5-previews.length-(editing&&form.hinhAnh&&previews.length===0?1:0))},(_,i)=><label className="hotel-upload-slot" key={i}><Plus/><input type="file" accept="image/png,image/jpeg,image/webp" onChange={addFiles}/></label>)}
        </div>
        <label>Ảnh giới thiệu khách sạn <b>*</b><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const result=await hotelApi.uploadImage(file);setField('anhGioiThieu',result.url)}catch(err){setError(apiError(err))}}}/></label>{form.anhGioiThieu&&<img src={form.anhGioiThieu} alt="Ảnh giới thiệu" style={{maxWidth:220,maxHeight:140,objectFit:'cover'}}/>}
        <p className="hotel-frontend-note">Ảnh đầu tiên được upload vào Hotel Service và lưu URL thật trong trường hinh_anh. Các ảnh bổ sung hiện dùng để xem trước vì schema hiện chỉ có một trường ảnh đại diện.</p>
      </section>

      <div className="hotel-form-actions">
        <button type="button" className="back" onClick={()=>navigate(profileMode ? '/provider/profile' : '/provider/hotels')}><ChevronLeft/> Quay lại</button>
        <div>
          <button type="button" className="cancel" onClick={()=>navigate(profileMode ? '/provider/profile' : '/provider/hotels')}>Hủy</button>
          <button className="save" disabled={busy}>{editing?<Save/>:<Plus/>}{busy?'Đang lưu...':editing?'Lưu thay đổi':'Thêm khách sạn'}</button>
        </div>
      </div>
    </form>
  </div>
}
