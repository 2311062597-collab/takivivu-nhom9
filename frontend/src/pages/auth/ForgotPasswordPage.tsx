import { ArrowLeft, Clock3, Mail, MapPin, Plane, Send, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/services'
import AuthScenery from '../../components/AuthScenery'
import Logo from '../../components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setMessage(''); setError('')
    try {
      const result = await authApi.forgotPassword(email.trim())
      setMessage(result.message || 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.')
    } catch {
      setError('Không thể gửi liên kết lúc này. Vui lòng kiểm tra kết nối hoặc thử lại sau.')
    } finally { setBusy(false) }
  }

  return <main className="travel-auth password-auth">
    <section className="travel-auth-visual auth-photo-side password-photo-side">
      <AuthScenery />
      <div className="auth-photo-layer auth-photo-login" aria-hidden="true" />
      <div className="auth-photo-overlay" aria-hidden="true" />
      <div className="travel-logo"><Logo /></div>
      <div className="password-hero-copy">
        <span className="password-eyebrow"><MapPin /> Hành trình của bạn vẫn đang chờ</span>
        <h1>Tiếp tục chuyến đi<br/><em>cùng TAKIVIVU</em></h1>
        <p>Khôi phục mật khẩu an toàn để tiếp tục quản lý chuyến bay, khách sạn và những trải nghiệm đã đặt.</p>
      </div>
      <div className="password-plane" aria-hidden="true"><Plane /></div>
      <div className="password-security"><ShieldCheck/><div><strong>Khôi phục an toàn</strong><span>Liên kết chỉ có hiệu lực trong 15 phút và chỉ dùng một lần.</span></div></div>
    </section>

    <section className="travel-auth-panel password-panel">
      <div className="password-card-wrap">
        <form className="travel-card password-card" onSubmit={submit}>
          <div className="password-icon"><Mail /></div>
          <span className="password-step">KHÔI PHỤC TÀI KHOẢN</span>
          <h2>Quên mật khẩu?</h2>
          <p className="password-subtitle">Nhập email đã đăng ký. TAKIVIVU sẽ gửi cho bạn liên kết để tạo mật khẩu mới.</p>
          {message && <div className="password-alert success"><Send /> <span>{message}<small>Hãy kiểm tra cả thư mục Spam nếu chưa thấy email.</small></span></div>}
          {error && <div className="password-alert error"><span>{error}</span></div>}
          <label className="travel-label">Địa chỉ email
            <span className="travel-input password-input"><Mail/><input type="email" required autoFocus autoComplete="email" placeholder="vidu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></span>
          </label>
          <div className="password-expiry"><Clock3/><span>Liên kết đặt lại mật khẩu có hiệu lực <strong>15 phút</strong>.</span></div>
          <button className="travel-primary password-submit" disabled={busy}>{busy ? 'ĐANG GỬI...' : <>GỬI LIÊN KẾT <Send /></>}</button>
          <Link className="password-back" to="/login"><ArrowLeft/> Quay lại đăng nhập</Link>
        </form>
        <p className="password-help">Bạn gặp khó khăn? Hãy liên hệ bộ phận hỗ trợ TAKIVIVU.</p>
      </div>
    </section>
  </main>
}
