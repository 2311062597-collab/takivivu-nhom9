import { Building2, Camera, CheckCircle2, FileCheck2, Mail, MapPin, RefreshCcw, Save, ShieldCheck, Star, CalendarDays } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hotelApi } from '../../api/services'
import type { HotelRequest } from '../../types'
import { apiError } from '../../utils/format'
import { GoogleMapAddressPreview } from '../../components/GoogleMap'
import { hasCoordinates } from '../../utils/googleMaps'

const empty: HotelRequest = {
  tenKhachSan: '', moTa: '', diaChi: '', thanhPho: '', quanHuyen: '', soDienThoai: '',
  email: '', soSao: 1, soTang: 0, tienNghi: '', hinhAnh: '', anhGioiThieu: '', anhThuVien: '', viDo: 0, kinhDo: 0,
}
const AMENITIES = ['Wi-Fi', 'Hồ bơi', 'Bãi đỗ xe', 'Nhà hàng', 'Bữa sáng', 'Thang máy', 'Điều hòa', 'Phòng gym', 'Spa', 'Lễ tân 24/7', 'Đưa đón sân bay', 'Phòng họp']
const validImage = (file: File) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024

export default function HotelProfileOriginalLayout() {
  const [hotelId, setHotelId] = useState<number | null>(null)
  const [form, setForm] = useState<HotelRequest>(empty)
  const [initial, setInitial] = useState<HotelRequest>(empty)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [approved, setApproved] = useState(false)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const [provinces, setProvinces] = useState<{code:number;name:string;districts:{name:string}[]}[]>([])
  const fallbackDistricts: Record<string,string[]> = {
    'Hà Nội': ['Ba Đình','Hoàn Kiếm','Tây Hồ','Long Biên','Cầu Giấy','Đống Đa','Hai Bà Trưng','Hoàng Mai','Thanh Xuân','Hà Đông','Đông Anh','Gia Lâm','Nam Từ Liêm','Bắc Từ Liêm'],
    'Hồ Chí Minh': ['Quận 1','Quận 3','Quận 4','Quận 5','Quận 6','Quận 7','Quận 8','Quận 10','Quận 11','Quận 12','Bình Thạnh','Gò Vấp','Phú Nhuận','Tân Bình','Tân Phú','Bình Tân','Thủ Đức'],
    'Đà Nẵng': ['Hải Châu','Thanh Khê','Sơn Trà','Ngũ Hành Sơn','Liên Chiểu','Cẩm Lệ','Hòa Vang'],
    'Hải Phòng': ['Hồng Bàng','Ngô Quyền','Lê Chân','Hải An','Kiến An','Đồ Sơn','Dương Kinh'],
    'Cần Thơ': ['Ninh Kiều','Bình Thủy','Cái Răng','Ô Môn','Thốt Nốt','Phong Điền'],
    'Huế': ['Phú Xuân','Thuận Hóa','Hương Thủy','Hương Trà','Phú Vang']
  }
  const cityOptions = provinces.length ? provinces.map(p => p.name) : Object.keys(fallbackDistricts)
  const selectedProvince = provinces.find(p => p.name === form.thanhPho)
  const districtOptions = selectedProvince ? selectedProvince.districts.map(d => d.name) : (fallbackDistricts[form.thanhPho] || [])

  useEffect(() => {
    let active = true
    hotelApi.mine().then(hotels => {
      if (!active) return
      const h = hotels[0]
      if (h) {
        setHotelId(h.id)
        const data: HotelRequest = {
          tenKhachSan: h.tenKhachSan || '', moTa: h.moTa || '', diaChi: h.diaChi || '',
          thanhPho: h.thanhPho || '', quanHuyen: h.quanHuyen || '', soDienThoai: h.soDienThoai || '',
          email: h.email || '', soSao: h.soSao || 1, soTang: h.soTang || 0,
          tienNghi: h.tienNghi || '', hinhAnh: h.hinhAnh || '', anhGioiThieu: h.anhGioiThieu || '', anhThuVien: h.anhThuVien || '',
          viDo: h.viDo || 0, kinhDo: h.kinhDo || 0,
        }
        setForm(data); setInitial(data)
        setApproved(h.hoSoHoanThien === true)
      }
    }).catch(e => { if (active) setError(apiError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Nguồn tỉnh/huyện cho biểu mẫu, có danh sách dự phòng khi dịch vụ ngoài không truy cập được.
  useEffect(() => {
    const controller = new AbortController()
    fetch('https://provinces.open-api.vn/api/?depth=2', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Không tải được địa giới'); return r.json() })
      .then((items: unknown) => {
        if (Array.isArray(items)) setProvinces(items.filter(x => x && typeof x.name === 'string' && Array.isArray(x.districts)))
      }).catch(() => { /* giữ danh sách dự phòng và ô nhập khác */ })
    return () => controller.abort()
  }, [])

  const change = <K extends keyof HotelRequest>(key: K, value: HotelRequest[K]) => {
    const addressChanged = ['thanhPho', 'quanHuyen', 'diaChi'].includes(key)
    setForm(current => ({ ...current, [key]: value, ...(addressChanged ? { viDo: 0, kinhDo: 0 } : {}), ...(key === 'thanhPho' ? { quanHuyen: '' } : {}) }))
  }

  const upload = async (key: 'hinhAnh' | 'anhGioiThieu', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!validImage(file)) { setError('Chỉ chấp nhận ảnh JPG, PNG, WEBP tối đa 5MB.'); return }
    setBusy(true); setError('')
    try {
      const result = await hotelApi.uploadImage(file)
      change(key, result.url)
    } catch (e) { setError(apiError(e)) }
    finally { setBusy(false) }
  }

  // Lưu danh sách ảnh dưới dạng JSON trong cột anh_thu_vien; không trộn với ảnh bìa/đại diện.
  const gallery: string[] = (() => { try { const a = JSON.parse(form.anhThuVien || '[]'); return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [] } catch { return [] } })()
  const uploadGallery = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.some(file => !validImage(file))) { setError('Ảnh phải là JPG, PNG hoặc WEBP, tối đa 5 MB/ảnh.'); return }
    if (gallery.length + files.length > 12) { setError('Chỉ được tải tối đa 12 ảnh khách sạn.'); return }
    setGalleryBusy(true); setError('')
    try {
      const uploaded: string[] = []
      for (const file of files) { const result = await hotelApi.uploadImage(file); uploaded.push(result.url) }
      setForm(current => {
        let old: string[] = []
        try { old = JSON.parse(current.anhThuVien || '[]') } catch { /* dữ liệu cũ */ }
        return { ...current, anhThuVien: JSON.stringify([...old, ...uploaded]) }
      })
    } catch (e) { setError(apiError(e)) }
    finally { setGalleryBusy(false) }
  }
  const removeGallery = (index: number) => change('anhThuVien', JSON.stringify(gallery.filter((_, i) => i !== index)))

  const selectedAmenities = (form.tienNghi || '').split(',').map(v => v.trim()).filter(Boolean)
  const toggleAmenity = (name: string) => {
    const next = selectedAmenities.includes(name)
      ? selectedAmenities.filter(v => v !== name)
      : [...selectedAmenities, name]
    change('tienNghi', next.join(', '))
  }
  const lat = Number(form.viDo), lng = Number(form.kinhDo)
  // (1,1) là dữ liệu thử trước đây: không coi là vị trí khách sạn.
  const validCoords = hasCoordinates(lat, lng) && !(lat === 1 && lng === 1)

  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    if (!form.tenKhachSan.trim() || !form.moTa?.trim() || !form.thanhPho.trim() || !form.quanHuyen?.trim() || !form.diaChi.trim() || !form.tienNghi?.trim() || !form.hinhAnh || !form.anhGioiThieu) {
      setError('Vui lòng hoàn thiện toàn bộ các trường bắt buộc và tải đủ hai loại ảnh.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '')) { setError('Email không hợp lệ.'); return }
    if (!/^\+?[0-9\s().-]{8,20}$/.test(form.soDienThoai || '')) { setError('Số điện thoại không hợp lệ.'); return }
    if (!Number.isInteger(form.soTang) || form.soTang < 1) { setError('Số tầng phải là số nguyên lớn hơn 0.'); return }
    if (!Number.isInteger(form.soSao) || form.soSao < 1 || form.soSao > 5) { setError('Hạng sao phải từ 1 đến 5.'); return }
    setBusy(true)
    try {
      // Tọa độ không bắt buộc. Tuyệt đối không chặn lưu khi Map Service không hoạt động.
      const payload = { ...form }
      if (!validCoords) { payload.viDo = 0; payload.kinhDo = 0 }
      const result = hotelId ? await hotelApi.update(hotelId, payload) : await hotelApi.create(payload)
      setHotelId(result.id); setForm(payload); setInitial(payload)
      setApproved(result.hoSoHoanThien === true)
      setMessage('Đã lưu hồ sơ khách sạn thành công.')
    } catch (e) { setError(apiError(e)) }
    finally { setBusy(false) }
  }

  return <div className="provider-profile-v2 hotel-profile-enhanced">
    <style>{`
      .hotel-profile-enhanced .hotel-star-field{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      .hotel-profile-enhanced .hotel-star-field b,.hotel-profile-enhanced .hotel-amenity-field b{color:#e24b4b}
      .hotel-profile-enhanced .hotel-star-buttons{display:flex;gap:4px}
      .hotel-profile-enhanced .hotel-star-buttons button{border:0;background:transparent;color:#b7bdc7;cursor:pointer;padding:4px}
      .hotel-profile-enhanced .hotel-star-buttons button.chosen{color:#f4b52c}
      .hotel-profile-enhanced .hotel-amenity-field{border:1px solid #e0e7f0;border-radius:8px;padding:12px;margin:8px 0}
      .hotel-profile-enhanced .hotel-amenity-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .hotel-profile-enhanced .hotel-amenity-options label{display:flex;align-items:center;gap:8px;cursor:pointer}
      .hotel-profile-enhanced .hotel-amenity-options input{width:17px;height:17px;accent-color:#1672e8}
      .hotel-profile-enhanced .hotel-gallery{border:1px solid #e0e7f0;border-radius:10px;padding:18px;margin:16px 0;background:white}
      .hotel-profile-enhanced .hotel-gallery h3{margin:0 0 6px;color:#17385e;font-size:17px}
      .hotel-profile-enhanced .hotel-gallery p{margin:0 0 14px;color:#718096;font-size:13px}
      .hotel-profile-enhanced .hotel-gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
      .hotel-profile-enhanced .hotel-gallery-tile{position:relative;aspect-ratio:4/3;border:1px solid #d6e2f0;border-radius:9px;overflow:hidden;background:#f5f9ff}
      .hotel-profile-enhanced .hotel-gallery-tile img{width:100%;height:100%;object-fit:cover}
      .hotel-profile-enhanced .hotel-gallery-remove{position:absolute;top:5px;right:5px;border:0;border-radius:50%;background:#fff;color:#c73535;width:26px;height:26px;cursor:pointer;box-shadow:0 1px 5px #0003}
      .hotel-profile-enhanced .hotel-gallery-add{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;cursor:pointer;border:2px dashed #a8c8f4;color:#1672e8;font-weight:600}
      .hotel-profile-enhanced .hotel-gallery-add input{display:none}
      .hotel-profile-enhanced .hotel-gallery-add svg{width:28px;height:28px}
      .hotel-profile-enhanced .provider-profile-cover{max-height:270px;min-height:190px}
      .hotel-profile-enhanced .provider-profile-cover-change input{display:none}
      .hotel-profile-enhanced .provider-profile-logo-box input{display:none}
      .hotel-profile-enhanced .hotel-location-card .hotel-interactive-map{position:relative;display:block;width:100%;height:300px;border:1px solid #d9e2ef;border-radius:8px;margin:12px 0;z-index:0;overflow:hidden}
      .hotel-profile-enhanced .hotel-location-card .hotel-map-error{display:block;color:#c43838;margin-top:8px}
      .hotel-profile-enhanced .hotel-locate-button{border:1px solid #1672e8;color:#1672e8;background:#fff;border-radius:7px;padding:10px;cursor:pointer}
      .hotel-profile-enhanced .hotel-profile-location-placeholder{position:static;inset:auto;display:block;width:100%;box-sizing:border-box;background:#f3f6fb;padding:18px;border-radius:8px;color:#7392ae;text-align:center;font-size:13px;margin:12px 0 0}
    `}</style>
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Hồ sơ nhà cung cấp</strong></div>
    <div className="provider-profile-heading"><div><h1>Hồ sơ nhà cung cấp</h1><p>Quản lý thông tin khách sạn của bạn.</p></div></div>
    <section className={`provider-profile-cover ${form.anhGioiThieu ? 'has-image' : ''}`} style={form.anhGioiThieu ? { backgroundImage: `url(${form.anhGioiThieu})` } : undefined}>
      {!form.anhGioiThieu && <div className="provider-profile-cover-art" aria-hidden="true"><i/><i/><i/><i/><i/></div>}
      <label className="provider-profile-cover-change"><Camera/> Ảnh giới thiệu khách sạn *<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload('anhGioiThieu', e)}/></label>
    </section>
    <div className="provider-profile-grid">
      <form className="provider-profile-main" onSubmit={e => void save(e)}>
        <div className="provider-profile-identity">
          <div className="provider-profile-logo-box">
            {form.hinhAnh ? <img src={form.hinhAnh} alt="Ảnh đại diện khách sạn"/> : <div className="provider-profile-logo-fallback"><Building2/><strong>KHÁCH SẠN</strong></div>}
            <label><Camera/><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void upload('hinhAnh', e)}/></label>
          </div>
          <button type="button" className="provider-profile-change-logo" onClick={() => document.querySelector<HTMLInputElement>('.provider-profile-logo-box input')?.click()}>Thay đổi ảnh đại diện *</button>
        </div>
        <section className="provider-profile-form-card">
          <h2><Building2/> Thông tin khách sạn</h2>
          {loading && <div>Đang tải hồ sơ...</div>}
          {!approved && <div className="provider-profile-warning">Vui lòng hoàn thiện hồ sơ khách sạn trước khi sử dụng các chức năng kinh doanh.</div>}
          {message && <div className="provider-profile-success"><CheckCircle2/>{message}</div>}
          {error && <div className="provider-profile-warning">{error}</div>}
          <div className="provider-profile-form-grid">
            <label>Tên khách sạn <b>*</b><input required value={form.tenKhachSan} onChange={e => change('tenKhachSan', e.target.value)}/></label>
            <div className="hotel-star-field"><span>Hạng sao <b>*</b></span><div className="hotel-star-buttons" role="group" aria-label="Chọn hạng sao">{[1,2,3,4,5].map(n => <button key={n} type="button" className={n <= form.soSao ? 'chosen' : ''} onClick={() => change('soSao', n)} aria-label={`${n} sao`} aria-pressed={form.soSao === n}><Star size={27} fill="currentColor" /></button>)}</div><small>{form.soSao} sao</small></div>
            <label className="span-2">Mô tả khách sạn <b>*</b><textarea required value={form.moTa || ''} onChange={e => change('moTa', e.target.value)}/></label>
          </div>
          <div className="provider-profile-form-grid compact">
            <label>Tỉnh/thành phố <b>*</b><input required list="hotel-province-options" placeholder="Chọn hoặc nhập tỉnh/thành phố" value={form.thanhPho} onChange={e => change('thanhPho', e.target.value)}/><datalist id="hotel-province-options">{cityOptions.map(city => <option key={city} value={city}/>)}</datalist></label>
            <label>Quận/huyện <b>*</b><input required list="hotel-district-options" placeholder="Chọn hoặc nhập quận/huyện" value={form.quanHuyen || ''} onChange={e => change('quanHuyen', e.target.value)}/><datalist id="hotel-district-options">{districtOptions.map(district => <option key={district} value={district}/>)}</datalist></label>
            <label className="span-2">Địa chỉ cụ thể <b>*</b><div className="provider-profile-input-icon"><MapPin/><input required value={form.diaChi} onChange={e => change('diaChi', e.target.value)}/></div></label>
            <label>Số điện thoại <b>*</b><input required value={form.soDienThoai || ''} onChange={e => change('soDienThoai', e.target.value)}/></label>
            <label>Email <b>*</b><div className="provider-profile-input-icon"><Mail/><input required type="email" value={form.email || ''} onChange={e => change('email', e.target.value)}/></div></label>
            <label>Số tầng <b>*</b><input required type="number" min="1" step="1" value={form.soTang || ''} onChange={e => change('soTang', Number(e.target.value))}/></label>
            <fieldset className="span-2 hotel-amenity-field"><legend>Tiện nghi <b>*</b></legend><div className="hotel-amenity-options">{AMENITIES.map(name => <label key={name}><input type="checkbox" checked={selectedAmenities.includes(name)} onChange={() => toggleAmenity(name)} />{name}</label>)}</div></fieldset>
          </div>
          <section className="hotel-gallery"><h3>Hình ảnh khách sạn</h3><p>Thêm các ảnh về khách sạn. Ảnh đại diện và ảnh bìa được thay đổi riêng ở phía trên. Tối đa 12 ảnh, mỗi ảnh không quá 5 MB.</p><div className="hotel-gallery-grid">{gallery.map((url, index) => <div className="hotel-gallery-tile" key={`${url}-${index}`}><img src={url} alt={`Ảnh khách sạn ${index + 1}`}/><button type="button" className="hotel-gallery-remove" aria-label={`Xóa ảnh ${index + 1}`} title="Xóa ảnh" onClick={() => removeGallery(index)}>×</button></div>)}{gallery.length < 12 && <label className="hotel-gallery-tile hotel-gallery-add"><Camera/><span>{galleryBusy ? 'Đang tải ảnh...' : '+ Thêm hình ảnh'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={galleryBusy || busy} onChange={e => void uploadGallery(e)}/></label>}</div></section>
          <div className="provider-profile-actions"><button type="button" className="secondary" onClick={() => {setForm(initial);setError('');setMessage('')}}><RefreshCcw/> Hủy thay đổi</button><button type="submit" className="primary" disabled={busy || loading}><Save/> {busy ? 'Đang lưu...' : 'Lưu thông tin'}</button></div>
        </section>
      </form>
      <aside className="provider-profile-side">
        <section className="provider-profile-side-card status"><h3><FileCheck2/> Trạng thái nhà cung cấp</h3>
          <div className={`provider-profile-status-banner ${approved ? 'active' : ''}`}><CheckCircle2/><div><strong>{approved ? 'Hồ sơ hoàn thiện' : 'Cần hoàn thiện hồ sơ'}</strong><small>{approved ? 'Đã lưu thông tin khách sạn.' : 'Điền đủ thông tin để tiếp tục.'}</small></div></div>
          <dl><div><dt><CalendarDays/>Hồ sơ khách sạn</dt><dd>{hotelId ? 'Đã tạo' : 'Chưa tạo'}</dd></div><div><dt><ShieldCheck/>Giấy tờ kinh doanh</dt><dd>Đã cung cấp khi đăng ký</dd></div></dl>
        </section>
        <section className="provider-profile-side-card hotel-location-card">
          <h3><MapPin/> Vị trí khách sạn</h3>
          <p>Nhập địa chỉ trong biểu mẫu để xem bản đồ. Địa chỉ được lưu theo thông tin bạn nhập.</p>
          <div className="hotel-interactive-map"><GoogleMapAddressPreview latitude={validCoords ? lat : undefined} longitude={validCoords ? lng : undefined} address={[form.diaChi, form.quanHuyen, form.thanhPho].filter(Boolean).join(', ')} title="Vị trí khách sạn" /></div>
          <small>Bạn có thể mở Google Maps để xem chi tiết hoặc chỉ đường. Không cần xác định tọa độ để lưu hồ sơ.</small>
        </section>
        <section className="provider-profile-side-card rating"><h3><Star/> Đánh giá khách hàng</h3><div className="provider-profile-rating"><strong>—<span>/5</span></strong><small>Chưa có dữ liệu đánh giá.</small></div></section>
      </aside>
    </div>
  </div>
}
