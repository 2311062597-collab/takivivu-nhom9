import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Plane, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/services'
import AuthScenery from '../../components/AuthScenery'
import Logo from '../../components/Logo'

export default function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get('token') || ''
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage('')
    if (password !== confirm) { setMessage('Mật khẩu xác nhận không khớp.'); return }
    setBusy(true)
    try { await authApi.resetPassword(token, password); setDone(true) }
    catch { setMessage('Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Hãy yêu cầu liên kết mới.') }
    finally { setBusy(false) }
  }
  return <main className="travel-auth password-auth">
    <section className="travel-auth-visual auth-photo-side password-photo-side"><AuthScenery/><div className="auth-photo-layer auth-photo-login"/><div className="auth-photo-overlay"/><div className="travel-logo"><Logo/></div><div className="password-hero-copy"><span className="password-eyebrow"><ShieldCheck/> Bảo mật tài khoản</span><h1>Sẵn sàng cho<br/><em>hành trình tiếp theo</em></h1><p>Tạo mật khẩu mới an toàn và quay lại khám phá những điểm đến tuyệt vời cùng TAKIVIVU.</p></div><div className="password-plane"><Plane/></div></section>
    <section className="travel-auth-panel password-panel"><div className="password-card-wrap"><form className="travel-card password-card" onSubmit={submit}>
      <div className={`password-icon ${done ? 'done' : ''}`}>{done ? <CheckCircle2/> : <KeyRound/>}</div>
      <span className="password-step">BẢO MẬT TÀI KHOẢN</span><h2>{done ? 'Đã đổi mật khẩu!' : 'Tạo mật khẩu mới'}</h2>
      {done ? <><p className="password-subtitle">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập và tiếp tục hành trình.</p><Link className="travel-primary password-submit password-login-link" to="/login">ĐĂNG NHẬP NGAY</Link></> : <>
        {!token && <div className="password-alert error">Liên kết đặt lại mật khẩu không hợp lệ. Hãy yêu cầu liên kết mới.</div>}
        {message && <div className="password-alert error">{message}</div>}
        <label className="travel-label">Mật khẩu mới<span className="travel-input password-input"><LockKeyhole/><input type={show?'text':'password'} minLength={8} maxLength={100} required disabled={!token} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></span></label>
        <label className="travel-label">Xác nhận mật khẩu<span className="travel-input password-input"><LockKeyhole/><input type={show?'text':'password'} required disabled={!token} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={confirm} onChange={e=>setConfirm(e.target.value)}/></span></label>
        <button className="travel-primary password-submit" disabled={busy||!token}>{busy?'ĐANG LƯU...':'ĐẶT LẠI MẬT KHẨU'}</button>
        <Link className="password-back" to="/forgot-password"><ArrowLeft/> Yêu cầu liên kết mới</Link>
      </>}
    </form></div></section>
  </main>
}
