import { Database, LockKeyhole, Palette, Save, Server, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { authApi } from '../../api/services'

type UiSettings = {
  systemName: string; description: string; primary: string; secondary: string
  language: string; timezone: string; dateFormat: string; timeFormat: string
  maxFailed: string; lockMinutes: string; allowRegister: boolean; autoApproveProvider: boolean
}
const defaults: UiSettings = {
  systemName:'TAKIVIVU', description:'Nền tảng đặt dịch vụ du lịch', primary:'#1E88E5', secondary:'#FFB300',
  language:'vi', timezone:'Asia/Ho_Chi_Minh', dateFormat:'dd/MM/yyyy', timeFormat:'HH:mm',
  maxFailed:'5', lockMinutes:'30', allowRegister:true, autoApproveProvider:false,
}
const keys: Record<keyof UiSettings,string> = {
  systemName:'system.name', description:'system.description', primary:'ui.primary_color', secondary:'ui.secondary_color',
  language:'ui.default_language', timezone:'ui.timezone', dateFormat:'ui.date_format', timeFormat:'ui.time_format',
  maxFailed:'login.max_failed', lockMinutes:'login.lock_minutes', allowRegister:'login.allow_register', autoApproveProvider:'login.auto_approve_provider',
}
export default function AdminSettingsPage(){
 const [settings,setSettings]=useState(defaults); const [saved,setSaved]=useState(false); const [loading,setLoading]=useState(true); const [error,setError]=useState('')
 const update=<K extends keyof UiSettings>(k:K,v:UiSettings[K])=>setSettings(c=>({...c,[k]:v}))
 useEffect(()=>{ authApi.adminSettings().then(rows=>{
   const map=Object.fromEntries(rows.map(r=>[r.khoa,r.giaTri ?? '']))
   setSettings({...defaults, systemName:map[keys.systemName]||defaults.systemName, description:map[keys.description]||'', primary:map[keys.primary]||defaults.primary, secondary:map[keys.secondary]||defaults.secondary,
    language:map[keys.language]||defaults.language, timezone:map[keys.timezone]||defaults.timezone, dateFormat:map[keys.dateFormat]||defaults.dateFormat, timeFormat:map[keys.timeFormat]||defaults.timeFormat,
    maxFailed:map[keys.maxFailed]||'5', lockMinutes:map[keys.lockMinutes]||'30', allowRegister:(map[keys.allowRegister]??'true')==='true', autoApproveProvider:(map[keys.autoApproveProvider]??'false')==='true'})
 }).catch(e=>setError(e?.response?.data?.message||'Không tải được cài đặt hệ thống')).finally(()=>setLoading(false)) },[])
 const save=async()=>{ setError(''); try{ const body:Record<string,string>={}; (Object.keys(keys) as (keyof UiSettings)[]).forEach(k=>body[keys[k]]=String(settings[k])); await authApi.updateAdminSettings(body); document.documentElement.style.setProperty('--admin-primary',settings.primary); document.documentElement.style.setProperty('--admin-secondary',settings.secondary); setSaved(true); setTimeout(()=>setSaved(false),1800) }catch(e:any){setError(e?.response?.data?.message||'Không lưu được cài đặt hệ thống')} }
 if(loading) return <div className="admin2-page"><p>Đang tải cài đặt hệ thống...</p></div>
 return <div className="admin2-page">
  <div className="admin2-breadcrumb">Trang chủ <span>›</span> Cài đặt hệ thống</div>
  <div className="admin2-page-head"><div><h1>Cài đặt hệ thống</h1><p>Các thay đổi được lưu trực tiếp vào cơ sở dữ liệu Auth Service.</p></div></div>
  {error && <div className="admin2-settings-note"><Database/><span><b>{error}</b></span></div>}
  <section className="admin2-settings-card"><div className="admin2-section-title"><span><Server/></span><div><h2>Thông tin hệ thống</h2><p>Thông tin nhận diện TAKIVIVU.</p></div></div><div className="admin2-settings-grid single">
   <label>Tên hệ thống *<input value={settings.systemName} onChange={e=>update('systemName',e.target.value)}/></label>
   <label>Mô tả hệ thống<textarea rows={2} value={settings.description} onChange={e=>update('description',e.target.value)}/></label>
  </div></section>
  <section className="admin2-settings-card"><div className="admin2-section-title"><span><Palette/></span><div><h2>Giao diện</h2><p>Cấu hình được lưu trong bảng cai_dat_he_thong.</p></div></div><div className="admin2-settings-columns"><div className="admin2-settings-grid">
   <label>Màu chủ đạo<div className="admin2-color-field"><input type="color" value={settings.primary} onChange={e=>update('primary',e.target.value)}/><input value={settings.primary} onChange={e=>update('primary',e.target.value)}/></div></label>
   <label>Màu phụ<div className="admin2-color-field"><input type="color" value={settings.secondary} onChange={e=>update('secondary',e.target.value)}/><input value={settings.secondary} onChange={e=>update('secondary',e.target.value)}/></div></label></div><div className="admin2-settings-grid">
   <label>Ngôn ngữ mặc định<select value={settings.language} onChange={e=>update('language',e.target.value)}><option value="vi">Tiếng Việt</option></select></label>
   <label>Múi giờ<select value={settings.timezone} onChange={e=>update('timezone',e.target.value)}><option value="Asia/Ho_Chi_Minh">(GMT+07:00) Bangkok, Hanoi, Jakarta</option></select></label>
   <label>Định dạng ngày<select value={settings.dateFormat} onChange={e=>update('dateFormat',e.target.value)}><option>dd/MM/yyyy</option><option>yyyy-MM-dd</option></select></label>
   <label>Định dạng giờ<select value={settings.timeFormat} onChange={e=>update('timeFormat',e.target.value)}><option>HH:mm</option><option>hh:mm a</option></select></label>
  </div></div></section>
  <section className="admin2-settings-card"><div className="admin2-section-title"><span><LockKeyhole/></span><div><h2>Cấu hình đăng nhập</h2><p>Các giá trị được đọc và lưu trong auth_db.cai_dat_he_thong.</p></div></div><div className="admin2-login-settings"><div className="admin2-readonly-fields">
   <label>Giới hạn số lần đăng nhập sai<input type="number" min="1" value={settings.maxFailed} onChange={e=>update('maxFailed',e.target.value)}/></label>
   <label>Thời gian khóa tài khoản (phút)<input type="number" min="1" value={settings.lockMinutes} onChange={e=>update('lockMinutes',e.target.value)}/></label>
  </div><div className="admin2-switch-list">
   <div onClick={()=>update('allowRegister',!settings.allowRegister)}><span><b>Cho phép đăng ký tài khoản mới</b><small>Lưu vào login.allow_register.</small></span><i className={settings.allowRegister?'on':''}/></div>
   <div onClick={()=>update('autoApproveProvider',!settings.autoApproveProvider)}><span><b>PROVIDER tự động kích hoạt</b><small>Lưu vào login.auto_approve_provider.</small></span><i className={settings.autoApproveProvider?'on':''}/></div>
  </div></div><div className="admin2-settings-note"><Database/><span><b>Dữ liệu được lưu vào DB.</b> Không còn dùng localStorage cho Cài đặt hệ thống.</span></div></section>
  <div className="admin2-savebar"><span>{saved?<><ShieldCheck/>Đã lưu vào cơ sở dữ liệu</>:''}</span><button onClick={save}><Save/>Lưu thay đổi</button></div>
 </div>
}
