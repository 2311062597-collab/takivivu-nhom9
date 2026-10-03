import HotelProfileOriginalLayout from './HotelProfileOriginalLayout'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  FileCheck2,
  Globe2,
  Hotel,
  Mail,
  MapPin,
  Mountain,
  Plane,
  RefreshCcw,
  Save,
  ShieldCheck,
  Star,
  Ticket,
  UserCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Profile, ProviderType } from '../../types'
import { apiError } from '../../utils/format'

type ProviderService = ProviderType | 'TICKET'

interface ProviderProfileExtra {
  businessName: string
  shortName: string
  description: string
  services: ProviderService[]
  taxCode: string
  foundedYear: string
  website: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  joinedAt: string
  approvedAt: string
  licenseStatus: string
  coverImage: string
  logoImage: string
}

const storageKey = (id?: number) => `takivivu:provider-profile:${id || 'local'}`

function defaults(profile: Profile | null, type: ProviderType | null | undefined, sessionEmail?: string): ProviderProfileExtra {
  const name = profile?.hoTen || 'Nguyễn Văn An'
  const fallbackBusiness = type === 'FLIGHT' ? 'Công ty TNHH TAKIVIVU Aviation' : type === 'ATTRACTION' ? 'Công ty TNHH An Travel' : 'Công ty TNHH An Travel'
  return {
    businessName: fallbackBusiness,
    shortName: fallbackBusiness.replace(/^Công ty TNHH\s*/i, '').trim() || name,
    description: 'Đơn vị cung cấp các dịch vụ du lịch chất lượng cao, cam kết mang đến trải nghiệm tốt nhất cho khách hàng.',
    services: type === 'ATTRACTION' ? ['ATTRACTION', 'TICKET'] : type ? [type] : ['HOTEL', 'ATTRACTION'],
    taxCode: '0101234567',
    foundedYear: '2019',
    website: 'https://antravel.vn',
    businessAddress: profile?.diaChi || 'Số 123 Trần Duy Hưng, Cầu Giấy, Hà Nội',
    businessPhone: profile?.soDienThoai || '024 1234 5678',
    businessEmail: profile?.email || sessionEmail || 'contact@antravel.vn',
    joinedAt: '15/03/2024',
    approvedAt: 'Đã xác thực',
    licenseStatus: 'Đã duyệt',
    coverImage: '',
    logoImage: profile?.anhDaiDien || '',
  }
}

function loadExtra(id: number | undefined, base: ProviderProfileExtra) {
  try {
    const raw = localStorage.getItem(storageKey(id))
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<ProviderProfileExtra>
    return { ...base, ...parsed, services: parsed.services?.length ? parsed.services : base.services }
  } catch {
    return base
  }
}

function filePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const serviceOptions: Array<{ value: ProviderService; label: string; icon: typeof Hotel }> = [
  { value: 'HOTEL', label: 'Khách sạn', icon: Hotel },
  { value: 'ATTRACTION', label: 'Địa điểm tham quan', icon: Mountain },
  { value: 'TICKET', label: 'Vé tham quan', icon: Ticket },
  { value: 'FLIGHT', label: 'Chuyến bay', icon: Plane },
]

export default function ProviderProfilePage() {
  const auth = useAuth()
  if (auth.session?.loaiNhaCungCap === 'HOTEL') return <HotelProfileOriginalLayout />
  return <GeneralProviderProfilePage />
}

function GeneralProviderProfilePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [extra, setExtra] = useState<ProviderProfileExtra>(() => loadExtra(session?.id, defaults(null, session?.loaiNhaCungCap, session?.email)))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    authApi.profile().then(data => {
      if (!active) return
      setProfile(data)
      setExtra(loadExtra(session?.id || data.id, defaults(data, session?.loaiNhaCungCap, session?.email)))
    }).catch(err => {
      if (!active) return
      setError(apiError(err))
    })
    return () => { active = false }
  }, [session?.email, session?.id, session?.loaiNhaCungCap])

  const visibleProfile = profile || {
    id: session?.id || 0,
    hoTen: session?.hoTen || 'Nguyễn Văn An',
    email: session?.email || 'contact@antravel.vn',
    soDienThoai: extra.businessPhone,
    vaiTro: 'PROVIDER' as const,
    trangThai: session?.trangThai || 'ACTIVE',
    anhDaiDien: null,
    diaChi: extra.businessAddress,
  }

  const serviceCount = useMemo(() => new Set(extra.services).size, [extra.services])
  const isActive = visibleProfile.trangThai === 'ACTIVE'

  const toggleService = (value: ProviderService) => {
    setExtra(current => {
      const included = current.services.includes(value)
      return { ...current, services: included ? current.services.filter(item => item !== value) : [...current.services, value] }
    })
  }

  const updateImage = async (kind: 'coverImage' | 'logoImage', event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    try {
      const src = await filePreview(file)
      setExtra(current => ({ ...current, [kind]: src }))
    } catch {
      setError('Không thể đọc ảnh đã chọn.')
    }
  }

  const reset = () => {
    const base = loadExtra(session?.id || visibleProfile.id, defaults(profile, session?.loaiNhaCungCap, session?.email))
    setExtra(base)
    setMessage('')
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        hoTen: visibleProfile.hoTen,
        soDienThoai: extra.businessPhone || visibleProfile.soDienThoai,
        anhDaiDien: extra.logoImage || visibleProfile.anhDaiDien || undefined,
        diaChi: extra.businessAddress || visibleProfile.diaChi || undefined,
      }
      try {
        const updated = await authApi.updateProfile(payload)
        setProfile(updated)
      } catch (apiErr) {
        // Extended provider fields do not exist in the current backend. Keep the UI usable
        // by saving them locally while still surfacing the API problem as a non-blocking note.
        setError(`Thông tin mở rộng đã lưu trên trình duyệt. API hồ sơ chưa cập nhật được: ${apiError(apiErr)}`)
      }
      localStorage.setItem(storageKey(session?.id || visibleProfile.id), JSON.stringify(extra))
      setMessage('Đã lưu thông tin nhà cung cấp.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="provider-profile-v2">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Hồ sơ nhà cung cấp</strong></div>
    <div className="provider-profile-heading">
      <div><h1>Hồ sơ nhà cung cấp</h1><p>Quản lý và cập nhật thông tin, tài khoản và các dịch vụ nhà cung cấp.</p></div>
    </div>

    <section className={`provider-profile-cover ${extra.coverImage ? 'has-image' : ''}`} style={extra.coverImage ? { backgroundImage: `url(${extra.coverImage})` } : undefined}>
      {!extra.coverImage && <div className="provider-profile-cover-art" aria-hidden="true"><i/><i/><i/><i/><i/></div>}
      <label className="provider-profile-cover-change"><Camera/> Thay đổi ảnh bìa<input type="file" accept="image/*" onChange={event => void updateImage('coverImage', event)}/></label>
    </section>

    <div className="provider-profile-grid">
      <form className="provider-profile-main" onSubmit={save}>
        <div className="provider-profile-identity">
          <div className="provider-profile-logo-box">
            {extra.logoImage ? <img src={extra.logoImage} alt="Logo nhà cung cấp"/> : <div className="provider-profile-logo-fallback"><Mountain/><strong>AN TRAVEL</strong><small>TRAVEL &amp; TOUR</small></div>}
            <label><Camera/><input type="file" accept="image/*" onChange={event => void updateImage('logoImage', event)}/></label>
          </div>
          <button type="button" className="provider-profile-change-logo" onClick={() => document.querySelector<HTMLInputElement>('.provider-profile-logo-box input')?.click()}>Thay đổi logo</button>
        </div>

        <section className="provider-profile-form-card">
          <h2><Building2/> Thông tin nhà cung cấp</h2>
          {message && <div className="provider-profile-success"><CheckCircle2/>{message}</div>}
          {error && <div className="provider-profile-warning">{error}</div>}

          <div className="provider-profile-form-grid">
            <label>Tên nhà cung cấp <b>*</b><input value={extra.businessName} onChange={e => setExtra({...extra,businessName:e.target.value})}/></label>
            <label>Tên viết tắt <b>*</b><input value={extra.shortName} onChange={e => setExtra({...extra,shortName:e.target.value})}/></label>
            <label className="span-2">Mô tả <b>*</b><textarea maxLength={500} value={extra.description} onChange={e => setExtra({...extra,description:e.target.value})}/><small>{extra.description.length}/500</small></label>
          </div>

          <div className="provider-profile-services">
            <label>Loại hình cung cấp <b>*</b></label>
            <div>{serviceOptions.map(({value,label,icon:Icon}, index) => {
              const checked = extra.services.includes(value)
              return <button key={`${value}-${label}-${index}`} type="button" className={checked?'active':''} onClick={() => toggleService(value)}><span className="check">{checked&&<Check/>}</span><Icon/>{label}</button>
            })}</div>
          </div>

          <div className="provider-profile-form-grid compact">
            <label>Mã số thuế <b>*</b><input value={extra.taxCode} onChange={e => setExtra({...extra,taxCode:e.target.value})}/></label>
            <label>Năm thành lập <b>*</b><input value={extra.foundedYear} onChange={e => setExtra({...extra,foundedYear:e.target.value})}/></label>
            <label className="span-2">Website<div className="provider-profile-input-icon"><Globe2/><input value={extra.website} onChange={e => setExtra({...extra,website:e.target.value})}/></div></label>
            <label className="span-2">Địa chỉ <b>*</b><div className="provider-profile-input-icon"><MapPin/><input value={extra.businessAddress} onChange={e => setExtra({...extra,businessAddress:e.target.value})}/></div></label>
            <label>Số điện thoại <b>*</b><input value={extra.businessPhone} onChange={e => setExtra({...extra,businessPhone:e.target.value})}/></label>
            <label>Email <b>*</b><div className="provider-profile-input-icon"><Mail/><input type="email" value={extra.businessEmail} onChange={e => setExtra({...extra,businessEmail:e.target.value})}/></div></label>
          </div>

          <div className="provider-profile-actions"><button type="button" className="secondary" onClick={reset}><RefreshCcw/> Hủy thay đổi</button><button type="submit" className="primary" disabled={busy}><Save/> {busy?'Đang lưu...':'Lưu thông tin'}</button></div>
        </section>
      </form>

      <aside className="provider-profile-side">
        <section className="provider-profile-side-card status">
          <h3><FileCheck2/> Trạng thái nhà cung cấp</h3>
          <div className={`provider-profile-status-banner ${isActive?'active':''}`}><CheckCircle2/><div><strong>{isActive?'Đang hoạt động':'Đang chờ duyệt'}</strong><small>{isActive?'Tài khoản đã được xác thực.':'Tài khoản chưa được kích hoạt.'}</small></div></div>
          <dl>
            <div><dt><CalendarDays/>Ngày tham gia</dt><dd>{extra.joinedAt}</dd></div>
            <div><dt><UserCheck/>Xác thực tài khoản</dt><dd className="green">{extra.approvedAt}</dd></div>
            <div><dt><ShieldCheck/>Giấy tờ pháp lý</dt><dd className="green">{extra.licenseStatus}</dd></div>
          </dl>
          <button type="button"><FileCheck2/> Xem giấy tờ pháp lý</button>
        </section>

        <section className="provider-profile-side-card rating">
          <h3><Star/> Đánh giá khách hàng</h3>
          <div className="provider-profile-rating"><strong>—<span>/5</span></strong><small>Chưa có dữ liệu đánh giá từ backend.</small></div>
          <button type="button" onClick={() => navigate('/provider/reviews')}>Xem đánh giá</button>
        </section>

        <section className="provider-profile-side-card metrics">
          <h3><BadgeCheck/> Thống kê nhanh</h3>
          <div className="provider-profile-metric-grid">
            {session?.loaiNhaCungCap === 'FLIGHT' && <div><Plane/><strong>—</strong><small>Chuyến bay</small></div>}
            {session?.loaiNhaCungCap === 'HOTEL' && <div><Hotel/><strong>—</strong><small>Khách sạn</small></div>}
            {session?.loaiNhaCungCap === 'ATTRACTION' && <div><MapPin/><strong>—</strong><small>Địa điểm tham quan</small></div>}
          </div>
          <div className="provider-profile-services-count"><span>Dịch vụ đang cung cấp</span><b>{serviceCount}</b></div>
        </section>
      </aside>
    </div>
  </div>
}
