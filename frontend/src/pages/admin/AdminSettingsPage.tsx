import { Database, Image, LockKeyhole, Palette, Save, Server, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

type UiSettings = {
  systemName: string
  description: string
  primary: string
  secondary: string
  language: string
  timezone: string
  dateFormat: string
  timeFormat: string
}

const KEY = 'takivivu_admin_ui_settings'
const defaults: UiSettings = {
  systemName: 'TAKIVIVU',
  description: 'Khám phá thế giới, đi hơn bao giờ hết',
  primary: '#0D6EFD',
  secondary: '#6C8FFF',
  language: 'Tiếng Việt',
  timezone: '(GMT+07:00) Bangkok, Hanoi, Jakarta',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24 giờ (HH:mm)',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<UiSettings>(defaults)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) })
    } catch { /* ignore invalid local data */ }
  }, [])

  const update = <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => setSettings(current => ({ ...current, [key]: value }))
  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(settings))
    document.documentElement.style.setProperty('--admin-primary', settings.primary)
    document.documentElement.style.setProperty('--admin-secondary', settings.secondary)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return <div className="admin2-page">
    <div className="admin2-breadcrumb">Trang chủ <span>›</span> Cài đặt hệ thống</div>
    <div className="admin2-page-head"><div><h1>Cài đặt hệ thống</h1><p>Quản lý thông tin hiển thị, giao diện và tham chiếu cấu hình đăng nhập.</p></div></div>

    <section className="admin2-settings-card">
      <div className="admin2-section-title"><span><Server /></span><div><h2>Thông tin hệ thống</h2><p>Cấu hình thông tin nhận diện dùng trên giao diện quản trị.</p></div></div>
      <div className="admin2-settings-grid single">
        <label>Tên hệ thống *<input value={settings.systemName} onChange={e => update('systemName', e.target.value)} /></label>
        <label>Mô tả hệ thống<textarea rows={2} value={settings.description} onChange={e => update('description', e.target.value)} /></label>
      </div>
      <div className="admin2-brand-preview"><span>Logo</span><div><div className="admin2-logo-mark">✈</div><b>TAKIVIVU<small>Khám phá thế giới, đi hơn bao giờ hết</small></b></div><button disabled><Image /> Thay đổi logo</button><em>Backend hiện chưa có API lưu logo hệ thống.</em></div>
    </section>

    <section className="admin2-settings-card">
      <div className="admin2-section-title"><span><Palette /></span><div><h2>Giao diện</h2><p>Tùy chỉnh giao diện hiển thị của khu vực Admin trên trình duyệt này.</p></div></div>
      <div className="admin2-settings-columns">
        <div className="admin2-settings-grid">
          <label>Màu chủ đạo<div className="admin2-color-field"><input type="color" value={settings.primary} onChange={e => update('primary', e.target.value)} /><input value={settings.primary} onChange={e => update('primary', e.target.value)} /></div></label>
          <label>Màu phụ<div className="admin2-color-field"><input type="color" value={settings.secondary} onChange={e => update('secondary', e.target.value)} /><input value={settings.secondary} onChange={e => update('secondary', e.target.value)} /></div></label>
        </div>
        <div className="admin2-settings-grid">
          <label>Ngôn ngữ mặc định<select value={settings.language} onChange={e => update('language', e.target.value)}><option>Tiếng Việt</option></select></label>
          <label>Múi giờ<select value={settings.timezone} onChange={e => update('timezone', e.target.value)}><option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option></select></label>
          <label>Định dạng ngày<select value={settings.dateFormat} onChange={e => update('dateFormat', e.target.value)}><option>dd/MM/yyyy</option><option>yyyy-MM-dd</option></select></label>
          <label>Định dạng giờ<select value={settings.timeFormat} onChange={e => update('timeFormat', e.target.value)}><option>24 giờ (HH:mm)</option><option>12 giờ (hh:mm a)</option></select></label>
        </div>
      </div>
    </section>

    <section className="admin2-settings-card">
      <div className="admin2-section-title"><span><LockKeyhole /></span><div><h2>Cấu hình đăng nhập</h2><p>Các giá trị dưới đây phản ánh chính sách Auth Service/SRS; thay đổi cần thực hiện ở Backend.</p></div></div>
      <div className="admin2-login-settings">
        <div className="admin2-readonly-fields">
          <label>Giới hạn số lần đăng nhập sai<input value="5" disabled /><small>Khóa tạm sau khi vượt quá số lần.</small></label>
          <label>Thời gian khóa tài khoản (phút)<input value="30" disabled /></label>
          <label>Access Token hiện tại<input value="60 phút" disabled /></label>
        </div>
        <div className="admin2-switch-list">
          <div><span><b>Cho phép đăng ký tài khoản mới</b><small>CUSTOMER và PROVIDER được đăng ký.</small></span><i className="on" /></div>
          <div><span><b>PROVIDER tự động kích hoạt</b><small>Không. PROVIDER phải chờ Admin duyệt.</small></span><i /></div>
          <div><span><b>Kiểm tra quyền ở Backend</b><small>Role được xác minh bằng JWT/Access Token.</small></span><i className="on" /></div>
        </div>
      </div>
      <div className="admin2-settings-note"><Database /><span><b>Không có bảng system_settings trong backend hiện tại.</b> Nút lưu bên dưới chỉ lưu tùy chọn giao diện Admin vào trình duyệt, không thay đổi chính sách Auth Service.</span></div>
    </section>

    <div className="admin2-savebar"><span>{saved ? <><ShieldCheck />Đã lưu giao diện trên trình duyệt</> : ''}</span><button onClick={save}><Save />Lưu thay đổi</button></div>
  </div>
}
