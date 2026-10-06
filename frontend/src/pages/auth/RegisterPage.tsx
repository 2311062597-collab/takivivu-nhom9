import { Building2, Eye, EyeOff, Headphones, Hotel, ImagePlus, Landmark, LockKeyhole, Mail, Plane, Quote, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthScenery from '../../components/AuthScenery'
import LegalModal from '../../components/LegalModal'
import Logo from '../../components/Logo'
import { authApi } from '../../api/services'
import type { ProviderType } from '../../types'
import { apiError } from '../../utils/format'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER')
  const [providerType, setProviderType] = useState<ProviderType>('HOTEL')
  const [form, setForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    xacNhanMatKhau: '',
    tenDoanhNghiep: '',
    anhGiayPhepKinhDoanh: '',
  })
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [licensePreview, setLicensePreview] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  const chooseLicense = (file: File | null) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Ảnh giấy phép chỉ hỗ trợ JPG, PNG hoặc WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh giấy phép không được vượt quá 5MB.')
      return
    }
    if (licensePreview) URL.revokeObjectURL(licensePreview)
    setLicenseFile(file)
    setLicensePreview(URL.createObjectURL(file))
    setError('')
  }

  const clearLicense = () => {
    if (licensePreview) URL.revokeObjectURL(licensePreview)
    setLicenseFile(null)
    setLicensePreview('')
    set('anhGiayPhepKinhDoanh', '')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')

    const email = form.email.trim()
    const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
    if (!emailPattern.test(email)) {
      setError('Email không đúng định dạng. Ví dụ hợp lệ: ten@gmail.com')
      return
    }
    if (!/^0\d{9}$/.test(form.soDienThoai)) {
      setError('Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0.')
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/.test(form.matKhau)) {
      setError('Mật khẩu phải từ 8-32 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.')
      return
    }
    if (form.matKhau !== form.xacNhanMatKhau) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    if (!accepted) {
      setError('Vui lòng đồng ý với điều khoản sử dụng và chính sách bảo mật.')
      return
    }
    if (kind === 'PROVIDER' && !licenseFile) {
      setError('Vui lòng đính kèm ảnh giấy phép kinh doanh.')
      return
    }

    setBusy(true)
    try {
      const base = {
        hoTen: form.hoTen.trim(),
        email,
        soDienThoai: form.soDienThoai,
        matKhau: form.matKhau,
        xacNhanMatKhau: form.xacNhanMatKhau,
      }

      if (kind === 'CUSTOMER') {
        await authApi.registerCustomer(base)
      } else {
        const uploaded = await authApi.uploadProviderLicense(licenseFile!)
        await authApi.registerProvider({
          ...base,
          tenDoanhNghiep: form.tenDoanhNghiep.trim(),
          anhGiayPhepKinhDoanh: uploaded.url,
          loaiNhaCungCap: providerType,
        })
      }

      // Đăng ký thành công luôn chuyển về trang đăng nhập.
      navigate('/login', { replace: true, state: { registered: true, providerPending: kind === 'PROVIDER' } })
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="travel-register register-reference-layout">
      <section className="register-visual auth-photo-side register-photo-side">
        <AuthScenery />
        <div className="auth-photo-layer auth-photo-register" aria-hidden="true" />
        <div className="auth-photo-overlay register-photo-overlay" aria-hidden="true" />
        <div className="travel-logo"><Logo /></div>
        <div className="register-plane" aria-hidden="true"><Plane /></div>

        <div className="register-benefits reference-benefits">
          <div><ShieldCheck /><p><strong>An toàn &amp; bảo mật</strong><span>Thông tin của bạn luôn được<br />bảo vệ tuyệt đối.</span></p></div>
          <div><Plane /><p><strong>Đa dạng dịch vụ</strong><span>Đặt chuyến bay, khách sạn và<br />trải nghiệm dễ dàng.</span></p></div>
          <div><Headphones /><p><strong>Hỗ trợ 24/7</strong><span>Đội ngũ chăm sóc khách hàng<br />luôn sẵn sàng hỗ trợ bạn.</span></p></div>
          <blockquote><Quote /> <span><b>TAKIVIVU</b> đồng hành cùng bạn<br />trong mọi hành trình.</span></blockquote>
        </div>
      </section>

      <section className="register-panel reference-register-panel">
        <header className="register-topbar reference-register-topbar">
          <div className="register-mobile-logo"><Logo compact /></div>
          <span>Đã có tài khoản?</span><Link to="/login">Đăng nhập</Link>
        </header>

        <form className="register-form-card reference-register-card" onSubmit={submit}>
          <h1>Tạo tài khoản</h1>
          <p>Vui lòng điền thông tin để đăng ký tài khoản</p>

          <span className="register-field-title">Loại tài khoản</span>
          <div className="register-account-types">
            <button type="button" className={kind === 'CUSTOMER' ? 'active' : ''} onClick={() => setKind('CUSTOMER')}>
              <UserRound /><span><strong>Khách hàng</strong><small>(CUSTOMER)</small></span><i />
            </button>
            <button type="button" className={kind === 'PROVIDER' ? 'active' : ''} onClick={() => setKind('PROVIDER')}>
              <Building2 /><span><strong>Nhà cung cấp</strong><small>(PROVIDER)</small></span><i />
            </button>
          </div>

          {kind === 'PROVIDER' && <>
            <div className="provider-hint"><UserRound /> <span>Tạo tài khoản nhà cung cấp để đăng quản lý và cung cấp dịch vụ trên TAKIVIVU.</span></div>
            <span className="register-field-title">Loại dịch vụ cung cấp <b>*</b></span>
            <div className="register-provider-types">
              <button type="button" className={providerType === 'HOTEL' ? 'active' : ''} onClick={() => setProviderType('HOTEL')}><Hotel /><strong>Khách sạn</strong><small>Lưu trú</small><i /></button>
              <button type="button" className={providerType === 'ATTRACTION' ? 'active' : ''} onClick={() => setProviderType('ATTRACTION')}><Landmark /><strong>Điểm tham quan</strong><small>Trải nghiệm</small><i /></button>
              <button type="button" className={providerType === 'FLIGHT' ? 'active' : ''} onClick={() => setProviderType('FLIGHT')}><Plane /><strong>Chuyến bay</strong><small>Vận chuyển</small><i /></button>
            </div>
          </>}

          {error && <div className="form-alert">{error}</div>}
          {msg && <div className="form-success">{msg}</div>}

          <label className="travel-label">{kind === 'PROVIDER' ? 'Tên nhà cung cấp' : 'Họ và tên'} <b>*</b>
            <span className="travel-input"><UserRound /><input required placeholder={kind === 'PROVIDER' ? 'Nhập tên nhà cung cấp' : 'Nhập họ và tên'} value={kind === 'PROVIDER' ? form.tenDoanhNghiep : form.hoTen} onChange={e => kind === 'PROVIDER' ? set('tenDoanhNghiep', e.target.value) : set('hoTen', e.target.value)} /></span>
          </label>

          {kind === 'PROVIDER' && <label className="travel-label provider-owner-name">Họ và tên người đại diện <b>*</b>
            <span className="travel-input"><UserRound /><input required placeholder="Nhập họ và tên" value={form.hoTen} onChange={e => set('hoTen', e.target.value)} /></span>
          </label>}

          <div className="register-two-cols">
            <label className="travel-label">Email <b>*</b>
              <span className="travel-input"><Mail /><input type="email" required placeholder="Nhập email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} /></span>
            </label>
            <label className="travel-label">Số điện thoại <b>*</b>
              <span className="travel-input"><span className="phone-prefix">+84</span><input className="phone-input" inputMode="numeric" required pattern="0\d{9}" title="Số điện thoại gồm 10 chữ số và bắt đầu bằng 0" placeholder="0xxxxxxxxx" value={form.soDienThoai} onChange={e => set('soDienThoai', e.target.value.replace(/\D/g, '').slice(0, 10))} /></span>
            </label>
          </div>

          {kind === 'PROVIDER' && <div className="travel-label provider-license">
            <span>Ảnh giấy phép kinh doanh <b>*</b></span>
            <div className={`provider-license-upload ${licenseFile ? 'has-file' : ''}`}>
              {licensePreview ? (
                <div className="provider-license-preview">
                  <img src={licensePreview} alt="Ảnh giấy phép kinh doanh đã chọn" />
                  <div>
                    <strong>{licenseFile?.name}</strong>
                    <small>{licenseFile ? `${(licenseFile.size / 1024 / 1024).toFixed(2)} MB` : ''}</small>
                  </div>
                  <button type="button" className="provider-license-remove" onClick={clearLicense} aria-label="Xóa ảnh đã chọn"><Trash2 /></button>
                </div>
              ) : (
                <label className="provider-license-picker">
                  <ImagePlus />
                  <span><strong>Đính kèm ảnh giấy phép</strong><small>JPG, PNG hoặc WEBP · tối đa 5MB</small></span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseLicense(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>
          </div>}

          <div className="register-two-cols password-cols">
            <label className="travel-label">Mật khẩu <b>*</b>
              <span className="travel-input"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} minLength={8} required placeholder="Nhập mật khẩu" autoComplete="new-password" value={form.matKhau} onChange={e => set('matKhau', e.target.value)} /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></span>
            </label>
            <label className="travel-label">Xác nhận mật khẩu <b>*</b>
              <span className="travel-input"><LockKeyhole /><input type={showConfirm ? 'text' : 'password'} required placeholder="Nhập lại mật khẩu" autoComplete="new-password" value={form.xacNhanMatKhau} onChange={e => set('xacNhanMatKhau', e.target.value)} /><button type="button" aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff /> : <Eye />}</button></span>
            </label>
          </div>

          <p className="password-note">8-32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt</p>

          <label className="register-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>Tôi đồng ý với <button type="button" onClick={() => setLegal('terms')}>Điều khoản sử dụng</button> và <button type="button" onClick={() => setLegal('privacy')}>Chính sách bảo mật</button> của TAKIVIVU <b>*</b></span></label>
          <button className="travel-primary register-submit" disabled={busy}>{busy ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</button>
        </form>

        <footer className="register-footer reference-register-footer">
          <span>◉ &nbsp;Tiếng Việt⌄</span>
          <button type="button" onClick={() => setLegal('terms')}>Điều khoản sử dụng</button>
          <button type="button" onClick={() => setLegal('privacy')}>Chính sách bảo mật</button>
          <span>Hỗ trợ</span>
        </footer>
      </section>

      {legal && <LegalModal type={legal} onClose={() => setLegal(null)} />}
    </main>
  )
}
