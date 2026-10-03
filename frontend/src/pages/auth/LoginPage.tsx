import { Eye, EyeOff, Hotel, LockKeyhole, Mail, Plane, ShieldCheck, Ticket, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthScenery from '../../components/AuthScenery'
import Logo from '../../components/Logo'
import { useAuth } from '../../contexts/AuthContext'
import { apiError } from '../../utils/format'

const features = [
  { icon: Plane, tone: 'blue', title: 'Chuyến bay', sub: 'Giá tốt mỗi ngày' },
  { icon: Hotel, tone: 'green', title: 'Khách sạn', sub: 'Đa dạng lựa chọn' },
  { icon: Ticket, tone: 'purple', title: 'Trải nghiệm', sub: 'Nhiều hoạt động thú vị' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', matKhau: '' })
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const remembered = localStorage.getItem('takivivu.rememberedEmail')
    if (remembered) {
      setForm(current => ({ ...current, email: remembered }))
      setRemember(true)
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await login({ email: form.email.trim(), matKhau: form.matKhau })
      if (remember) localStorage.setItem('takivivu.rememberedEmail', form.email.trim())
      else localStorage.removeItem('takivivu.rememberedEmail')
      navigate(session.vaiTro === 'PROVIDER' ? '/provider' : session.vaiTro === 'ADMIN' ? '/admin/providers' : '/')
    } catch (err) {
      setError(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="travel-auth login-auth auth-reference-layout">
      <section className="travel-auth-visual auth-photo-side login-photo-side">
        <AuthScenery />
        <div className="auth-photo-layer auth-photo-login" aria-hidden="true" />
        <div className="auth-photo-overlay" aria-hidden="true" />
        <div className="travel-logo"><Logo /></div>

        <div className="travel-copy login-reference-copy">
          <span className="travel-script">Khám phá</span>
          <h1>thế giới<br />theo cách của bạn!</h1>
          <p>Đặt chuyến bay, khách sạn và trải nghiệm<br className="desktop-break" /> dễ dàng với TAKIVIVU.</p>
        </div>

        <div className="travel-plane-path login-plane-path" aria-hidden="true">
          <svg viewBox="0 0 180 70"><path d="M2 60 C48 8, 102 54, 164 14" /></svg>
          <Plane />
        </div>

        <div className="travel-trust-card login-trust-card">
          <ShieldCheck />
          <div><strong>An toàn &amp; bảo mật</strong><small>Thông tin của bạn luôn được bảo vệ<br />với công nghệ mã hóa tiên tiến.</small></div>
        </div>
      </section>

      <section className="travel-auth-panel login-reference-panel">
        <div className="travel-auth-panel-inner login-reference-inner">
          <form className="travel-card login-card login-reference-card" onSubmit={submit}>
            <div className="travel-round-icon"><UserRound /></div>
            <h2>Đăng nhập</h2>
            <p className="travel-card-subtitle">Chào mừng bạn quay trở lại TAKIVIVU!</p>

            {error && <div className="form-alert">{error}</div>}

            <label className="travel-label">Email
              <span className="travel-input"><Mail /><input type="email" placeholder="Nhập email của bạn" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></span>
            </label>

            <label className="travel-label">Mật khẩu
              <span className="travel-input"><LockKeyhole /><input type={show ? 'text' : 'password'} placeholder="Nhập mật khẩu" autoComplete="current-password" required value={form.matKhau} onChange={e => setForm({ ...form, matKhau: e.target.value })} /><button type="button" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></span>
            </label>

            <div className="travel-card-row">
              <label className="travel-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /><span>Ghi nhớ đăng nhập</span></label>
            </div>

            <button className="travel-primary login-submit" disabled={busy}>{busy ? 'Đang đăng nhập...' : <>ĐĂNG NHẬP <span>→</span></>}</button>
            <div className="travel-divider"><span>hoặc</span></div>
            <p className="travel-switch">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
          </form>

          <div className="travel-features login-reference-features">
            {features.map(feature => {
              const Icon = feature.icon
              return <div className={`travel-feature ${feature.tone}`} key={feature.title}><span><Icon /></span><div><strong>{feature.title}</strong><small>{feature.sub}</small></div></div>
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
