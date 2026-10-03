import { GoogleMapAddressPreview } from '../../components/GoogleMap'
import {
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { attractionApi } from '../../api/services'
import type { AttractionRequest } from '../../types'
import { Loading } from '../../components/UI'
import { apiError } from '../../utils/format'
import {
  ATTRACTION_AMENITIES,
  ATTRACTION_CATEGORIES,
  attractionMetadataKey,
  loadAttractionExtra,
  saveAttractionExtra,
  type AttractionExtra,
} from './ProviderAttractionsPage'

const DISTRICTS_BY_CITY: Record<string, string[]> = {
  'Hà Nội': ['Ba Đình','Hoàn Kiếm','Tây Hồ','Long Biên','Cầu Giấy','Đống Đa','Hai Bà Trưng','Hoàng Mai','Thanh Xuân','Hà Đông','Bắc Từ Liêm','Nam Từ Liêm','Sơn Tây','Ba Vì','Chương Mỹ','Đan Phượng','Đông Anh','Gia Lâm','Hoài Đức','Mê Linh','Mỹ Đức','Phú Xuyên','Phúc Thọ','Quốc Oai','Sóc Sơn','Thạch Thất','Thanh Oai','Thanh Trì','Thường Tín','Ứng Hòa'],
  'TP. Hồ Chí Minh': ['Quận 1','Quận 3','Quận 4','Quận 5','Quận 6','Quận 7','Quận 8','Quận 10','Quận 11','Quận 12','Bình Thạnh','Bình Tân','Gò Vấp','Phú Nhuận','Tân Bình','Tân Phú','Thủ Đức','Bình Chánh','Cần Giờ','Củ Chi','Hóc Môn','Nhà Bè'],
  'Đà Nẵng': ['Hải Châu','Thanh Khê','Sơn Trà','Ngũ Hành Sơn','Liên Chiểu','Cẩm Lệ','Hòa Vang','Hoàng Sa'],
  'Quảng Ninh': ['Hạ Long','Cẩm Phả','Uông Bí','Móng Cái','Đông Triều','Quảng Yên','Vân Đồn','Cô Tô','Tiên Yên','Hải Hà','Đầm Hà','Bình Liêu','Ba Chẽ'],
  'Quảng Nam': ['Hội An','Tam Kỳ','Điện Bàn','Duy Xuyên','Đại Lộc','Thăng Bình','Núi Thành','Quế Sơn','Phú Ninh','Tiên Phước','Nam Giang','Đông Giang','Tây Giang','Nam Trà My','Bắc Trà My','Hiệp Đức','Nông Sơn','Phước Sơn'],
  'Khánh Hòa': ['Nha Trang','Cam Ranh','Ninh Hòa','Diên Khánh','Cam Lâm','Vạn Ninh','Khánh Vĩnh','Khánh Sơn','Trường Sa'],
  'Kiên Giang': ['Rạch Giá','Phú Quốc','Hà Tiên','Kiên Lương','Hòn Đất','Tân Hiệp','Châu Thành','Giồng Riềng','Gò Quao','An Biên','An Minh','Vĩnh Thuận','U Minh Thượng','Kiên Hải','Giang Thành'],
  'Lâm Đồng': ['Đà Lạt','Bảo Lộc','Đức Trọng','Di Linh','Lâm Hà','Đơn Dương','Lạc Dương','Bảo Lâm','Đạ Huoai','Đạ Tẻh','Cát Tiên','Đam Rông'],
  'Bà Rịa - Vũng Tàu': ['Vũng Tàu','Bà Rịa','Phú Mỹ','Châu Đức','Xuyên Mộc','Long Điền','Đất Đỏ','Côn Đảo'],
  'Bình Định': ['Quy Nhơn','An Nhơn','Hoài Nhơn','Tuy Phước','Phù Cát','Phù Mỹ','Hoài Ân','Tây Sơn','Vĩnh Thạnh','Vân Canh','An Lão'],
  'Ninh Bình': ['Ninh Bình','Tam Điệp','Hoa Lư','Gia Viễn','Nho Quan','Yên Khánh','Yên Mô','Kim Sơn'],
  'Huế': ['Thuận Hóa','Phú Xuân','Phong Điền','Hương Thủy','Hương Trà','Phú Vang','Quảng Điền','A Lưới','Phú Lộc'],
  'Hội An': ['Hội An'],
}

const cities = Object.keys(DISTRICTS_BY_CITY)

const blank: AttractionRequest = {
  tenDiaDiem: '',
  moTa: '',
  diaChi: '',
  quanHuyen: '',
  thanhPho: '',
  loaiDiaDiem: ATTRACTION_CATEGORIES[0],
  tienIch: [],
  viDo: 0,
  kinhDo: 0,
  placeId: undefined,
  gioMoCua: '08:00',
  gioDongCua: '22:00',
  hinhAnh: '',
}

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/^(quan|huyen|thi xa|thanh pho)\s+/i, '')
    .replace(/^tp\.?\s*/i, '')
    .trim()
    .toLowerCase()
}

function resolveCity(value?: string | null, formattedAddress?: string | null) {
  const target = normalize(value || '')
  if (target) {
    const direct = cities.find(city => normalize(city) === target || normalize(city).includes(target) || target.includes(normalize(city)))
    if (direct) return direct
  }
  const address = normalize(formattedAddress || '')
  return cities.find(city => address.includes(normalize(city))) || ''
}

function resolveDistrict(city: string, value?: string | null, formattedAddress?: string | null) {
  const options = DISTRICTS_BY_CITY[city] || []
  const target = normalize(value || '')
  if (target) {
    const direct = options.find(item => normalize(item) === target || normalize(item).includes(target) || target.includes(normalize(item)))
    if (direct) return direct
  }
  const address = normalize(formattedAddress || '')
  return options.find(item => address.includes(normalize(item))) || ''
}

export default function ProviderAttractionFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<AttractionRequest>(blank)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [removeOpen, setRemoveOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    attractionApi.detail(Number(id)).then(item => {
      const extra = loadAttractionExtra(item)
      const city = resolveCity(item.thanhPho, `${item.diaChi}, ${item.quanHuyen || ''}, ${item.thanhPho}`) || item.thanhPho
      const district = resolveDistrict(city, item.quanHuyen, item.diaChi) || item.quanHuyen || ''
      setForm({
        tenDiaDiem: item.tenDiaDiem,
        moTa: item.moTa || '',
        diaChi: item.diaChi,
        quanHuyen: district,
        thanhPho: city,
        loaiDiaDiem: item.loaiDiaDiem || extra.category,
        tienIch: item.tienIch || [],
        viDo: Number(item.viDo) || 0,
        kinhDo: Number(item.kinhDo) || 0,
        placeId: item.placeId || undefined,
        gioMoCua: String(item.gioMoCua || '08:00').slice(0,5),
        gioDongCua: String(item.gioDongCua || '22:00').slice(0,5),
        hinhAnh: item.hinhAnh || '',
      })
      setImages(extra.images)
    }).catch(e => setError(apiError(e))).finally(() => setLoading(false))
  }, [id])

  const districts = useMemo(() => DISTRICTS_BY_CITY[form.thanhPho] || [], [form.thanhPho])
  const mapQuery = [form.diaChi, form.quanHuyen, form.thanhPho].filter(Boolean).join(', ')
  const changeAddress = (key: 'thanhPho' | 'quanHuyen' | 'diaChi', value: string) => {
    setForm(current => ({ ...current, [key]: value, viDo: 0, kinhDo: 0, placeId: undefined,
      ...(key === 'thanhPho' ? { quanHuyen: '' } : {}) }))
  }

  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 5 - images.length))
    if (!files.length) return
    try {
      const values = await Promise.all(files.map(async file => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP')
        if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh không được vượt quá 5MB')
        const uploaded = await attractionApi.uploadImage(file)
        return uploaded.url
      }))
      setImages(current => [...current, ...values].slice(0,5))
    } catch (e) {
      setError(apiError(e) || 'Không thể tải ảnh đã chọn.')
    }
    event.target.value = ''
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const name = form.tenDiaDiem.trim()
    const description = form.moTa.trim()
    const address = form.diaChi.trim()
    if (name.length < 2 || name.length > 150) return setError('Tên địa điểm phải từ 2 đến 150 ký tự.')
    if (description.length > 1000) return setError('Mô tả không được vượt quá 1000 ký tự.')
    if (!form.thanhPho) return setError('Vui lòng chọn thành phố/khu vực.')
    if (!form.quanHuyen) return setError('Vui lòng chọn quận/huyện.')
    if (address.length > 255) return setError('Địa chỉ cụ thể không được vượt quá 255 ký tự.')
    if (!ATTRACTION_CATEGORIES.includes(form.loaiDiaDiem)) return setError('Loại địa điểm không hợp lệ.')
    if (form.tienIch.some(item => !ATTRACTION_AMENITIES.includes(item))) return setError('Danh sách tiện ích có giá trị không hợp lệ.')
    if (!form.gioMoCua || !form.gioDongCua) return setError('Vui lòng nhập đầy đủ giờ mở cửa và đóng cửa.')
    if (form.gioDongCua <= form.gioMoCua) return setError('Giờ đóng cửa phải sau giờ mở cửa.')
    if ((form.viDo || form.kinhDo) && (!Number.isFinite(Number(form.viDo)) || Number(form.viDo) < -90 || Number(form.viDo) > 90 || !Number.isFinite(Number(form.kinhDo)) || Number(form.kinhDo) < -180 || Number(form.kinhDo) > 180)) return setError('Tọa độ bản đồ không hợp lệ.')
    if (images.length === 0 && !form.hinhAnh) return setError('Vui lòng thêm ít nhất một hình ảnh địa điểm.')
    if (images.length > 5) return setError('Mỗi địa điểm chỉ được tối đa 5 hình ảnh.')
    setBusy(true)
    setError('')
    try {
      const safeImage = images[0] || form.hinhAnh || ''
      const payload: AttractionRequest = { ...form, tenDiaDiem: name, moTa: description, diaChi: address, hinhAnh: safeImage }
      const saved = editing && id
        ? await attractionApi.update(Number(id), payload)
        : await attractionApi.create(payload)

      const now = new Date().toLocaleString('vi-VN')
      let base: AttractionExtra = {
        category: saved.loaiDiaDiem || form.loaiDiaDiem,
        images,
        amenities: saved.tienIch || form.tienIch,
        rating: 4.7,
        reviews: 1256,
        createdAt: now,
        updatedAt: now,
      }
      if (editing) {
        const existing = loadAttractionExtra(saved)
        base = { ...existing, category: saved.loaiDiaDiem, images, amenities: saved.tienIch, updatedAt: now }
      }
      saveAttractionExtra(saved.id, base)
      navigate('/provider/attractions')
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      await attractionApi.remove(Number(id))
      try { localStorage.removeItem(attractionMetadataKey(Number(id))) } catch { /* ignore */ }
      navigate('/provider/attractions')
    } catch (e) {
      setError(apiError(e))
      setRemoveOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const toggleAmenity = (name: string) => {
    setForm(current => ({
      ...current,
      tienIch: current.tienIch.includes(name)
        ? current.tienIch.filter(item => item !== name)
        : [...current.tienIch, name],
    }))
  }

  if (loading) return <Loading label="Đang tải thông tin địa điểm..."/>

  return (
    <div className="provider-attraction-form-page">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/attractions">Quản lý địa điểm tham quan</Link><span>›</span><strong>{editing ? 'Sửa địa điểm tham quan' : 'Thêm địa điểm tham quan'}</strong></div>

      {error && <div className="hotel-form-error">{error}</div>}

      <form className="attraction-form-card" onSubmit={submit}>
        <div className="attraction-form-main-grid">
          <section className="attraction-form-left">
            <div className="attraction-form-two">
              <label>Tên địa điểm <b>*</b><input required value={form.tenDiaDiem} onChange={e => setForm({...form,tenDiaDiem:e.target.value})} placeholder="Hồ Hoàn Kiếm"/></label>
              <label>Loại địa điểm <b>*</b><select required value={form.loaiDiaDiem} onChange={e => setForm({...form,loaiDiaDiem:e.target.value})}>{ATTRACTION_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
            </div>

            <label className="attraction-form-description">Mô tả <small>(không bắt buộc)</small><textarea maxLength={1000} value={form.moTa} onChange={e => setForm({...form,moTa:e.target.value})} placeholder="Mô tả ngắn về địa điểm tham quan..."/><small>{form.moTa.length}/1000</small></label>

            <div className="attraction-form-two attraction-address-selects">
              <label>Thành phố/khu vực <b>*</b><select required value={form.thanhPho} onChange={e => setForm({...form,thanhPho:e.target.value,quanHuyen:'',viDo:0,kinhDo:0,placeId:undefined})}><option value="">Chọn thành phố/khu vực</option>{cities.map(item => <option key={item}>{item}</option>)}</select></label>
              <label>Quận/huyện <b>*</b><select required disabled={!form.thanhPho} value={form.quanHuyen} onChange={e => setForm({...form,quanHuyen:e.target.value,viDo:0,kinhDo:0,placeId:undefined})}><option value="">{form.thanhPho ? 'Chọn quận/huyện' : 'Chọn thành phố trước'}</option>{districts.map(item => <option key={item}>{item}</option>)}</select></label>
            </div>

            <label>Địa chỉ cụ thể <small>(không bắt buộc)</small><div className="attraction-address-input"><MapPin/><input disabled={!form.quanHuyen} value={form.diaChi} onChange={e => changeAddress('diaChi', e.target.value)} placeholder={form.quanHuyen ? 'Số nhà, tên đường, phường/xã...' : 'Chọn quận/huyện trước'}/>{form.diaChi && <button type="button" onClick={() => changeAddress('diaChi', '')}><X/></button>}</div><small className="attraction-address-help">Địa chỉ cụ thể là tùy chọn. Nhập địa chỉ trong biểu mẫu; bản đồ sẽ hiển thị theo nội dung bạn nhập.</small></label>

            <div className="attraction-time-row">
              <label>Giờ mở cửa <b>*</b><div className="attraction-time-input"><input type="time" required value={form.gioMoCua} onChange={e=>setForm({...form,gioMoCua:e.target.value})}/><Clock3/></div></label>
              <label>Giờ đóng cửa <b>*</b><div className="attraction-time-input"><input type="time" required value={form.gioDongCua} onChange={e=>setForm({...form,gioDongCua:e.target.value})}/><Clock3/></div></label>
            </div>

            <label className="attraction-images-label">Hình ảnh <b>*</b></label>
            <div className="attraction-image-row">
              {images.map((src,index)=><div className="attraction-image-preview" key={`${src.slice(0,32)}-${index}`}><img src={src} alt=""/><button type="button" onClick={()=>setImages(current=>current.filter((_,i)=>i!==index))}><X/></button></div>)}
              {images.length < 5 && <label className="attraction-image-add"><Plus/><span>Thêm ảnh</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages}/></label>}
              {images.length === 0 && <label className="attraction-image-drop"><UploadCloud/><div><strong>Kéo thả ảnh vào đây hoặc nhấp để chọn</strong><small>Hỗ trợ JPG, PNG, WEBP (tối đa 5MB/ảnh)</small></div><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages}/></label>}
            </div>
            <small className="attraction-image-note">Hỗ trợ JPG, PNG, WEBP (tối đa 5MB/ảnh). Bạn có thể thêm tối đa 5 ảnh.</small>
          </section>

          <section className="attraction-map-panel">
            <div className="attraction-map-panel-title"><h3><Map/> Vị trí trên bản đồ</h3></div>
            <div className="attraction-map-frame"><GoogleMapAddressPreview latitude={form.viDo} longitude={form.kinhDo} address={mapQuery} title="Vị trí địa điểm tham quan" /></div>
            <div className="attraction-map-hint">Bản đồ hiển thị theo địa chỉ đã nhập. Bạn có thể mở Google Maps để xem chi tiết hoặc chỉ đường. Hãy nhập và kiểm tra địa chỉ trong biểu mẫu trước khi lưu.</div>
          </section>
        </div>

        <section className="attraction-amenity-form">
          <h3>Tiện ích & dịch vụ</h3><p>Danh mục tiện ích được hệ thống quy định; các lựa chọn của địa điểm được lưu trong cơ sở dữ liệu.</p>
          <div>{ATTRACTION_AMENITIES.map(item=><label key={item}><input type="checkbox" checked={form.tienIch.includes(item)} onChange={()=>toggleAmenity(item)}/><span>✓</span><em>{item}</em></label>)}</div>
        </section>

        <div className="attraction-form-actions">
          {editing ? <button type="button" className="delete" onClick={()=>setRemoveOpen(true)}><Trash2/> Xóa địa điểm</button> : <span/>}
          <div><button type="button" className="cancel" onClick={()=>navigate('/provider/attractions')}>{editing?'Hủy':'Quay lại'}</button><button className="save" disabled={busy}><Save/>{busy?'Đang lưu...':editing?'Cập nhật địa điểm':'Lưu địa điểm'}</button></div>
        </div>
      </form>

      {removeOpen && <div className="attraction-modal-backdrop" onMouseDown={()=>!busy&&setRemoveOpen(false)}><div className="attraction-delete-modal" onMouseDown={e=>e.stopPropagation()}><button className="attraction-delete-close" onClick={()=>setRemoveOpen(false)}><X/></button><span className="attraction-delete-icon"><Trash2/></span><h3>Xóa địa điểm tham quan</h3><p>Bạn có chắc chắn muốn xóa địa điểm tham quan<br/><strong>“{form.tenDiaDiem}”?</strong></p><div className="attraction-delete-warning"><span>!</span><div><strong>Hành động này không thể hoàn tác.</strong><small>Không thể xóa địa điểm nếu đã có loại vé hoặc dữ liệu đặt vé liên quan.</small></div></div><div className="attraction-delete-actions"><button onClick={()=>setRemoveOpen(false)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void remove()}><Trash2/>{busy?'Đang xóa...':'Xóa địa điểm'}</button></div></div></div>}
    </div>
  )
}

