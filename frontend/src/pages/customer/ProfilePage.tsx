import {
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Gift,
  History,
  LogOut,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, bookingApi, paymentApi, promotionApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Booking, Payment, Profile, ServiceType } from '../../types'
import type { PromotionApiResponse } from '../../data/promotions'
import { apiError, money } from '../../utils/format'

type ProfileTab = 'personal' | 'journeys' | 'address'

const serviceName: Record<ServiceType, string> = {
  FLIGHT: 'Chuyến bay',
  HOTEL: 'Khách sạn',
  ATTRACTION: 'Địa điểm tham quan',
}

function promoLabel(p: PromotionApiResponse) {
  return p.discountType === 'PERCENTAGE'
    ? `Giảm ${Number(p.discountValue).toLocaleString('vi-VN')}%`
    : `Giảm ${money(p.discountValue)}`
}

export default function ProfilePage() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const fallback = useMemo<Profile | null>(() => session ? {
    id: session.id,
    hoTen: session.hoTen,
    email: session.email,
    soDienThoai: '',
    vaiTro: session.vaiTro,
    trangThai: session.trangThai,
    anhDaiDien: null,
    diaChi: null,
  } : null, [session])

  const [profile, setProfile] = useState<Profile | null>(fallback)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [promotions, setPromotions] = useState<PromotionApiResponse[]>([])
  const [tab, setTab] = useState<ProfileTab>('personal')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      const [profileResult, bookingResult, paymentResult, promoResult] = await Promise.allSettled([
        authApi.profile(),
        bookingApi.mine(),
        paymentApi.mine(),
        promotionApi.available(),
      ])

      if (!alive) return
      if (profileResult.status === 'fulfilled' && profileResult.value) setProfile(profileResult.value)
      if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value)
      if (paymentResult.status === 'fulfilled') setPayments(paymentResult.value)
      if (promoResult.status === 'fulfilled') setPromotions(promoResult.value)
      if (profileResult.status === 'rejected') {
        setNotice('Auth Service chưa trả đủ hồ sơ. Tạm hiển thị thông tin từ phiên đăng nhập.')
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!profile && fallback) setProfile(fallback)
  }, [profile, fallback])

  const stats = useMemo(() => {
    const validBookings = bookings.filter(b => !['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'].includes(b.trangThai))
    const spend = validBookings.reduce((sum, booking) => sum + Number(booking.tongTien || 0), 0)
    const services: Record<ServiceType, number> = { FLIGHT: 0, HOTEL: 0, ATTRACTION: 0 }
    validBookings.forEach(booking => booking.danhSachDichVu?.forEach(item => {
      if (item.loaiDichVu && services[item.loaiDichVu] !== undefined) services[item.loaiDichVu] += 1
    }))
    return { validBookings, spend, services }
  }, [bookings])

  if (!session) return <section className="customer-profile-v7"><div className="container customer-profile-v7-empty">Vui lòng đăng nhập để xem hồ sơ.</div></section>
  if (!profile) return <section className="customer-profile-v7"><div className="container customer-profile-v7-empty">Đang tải hồ sơ...</div></section>

  const initials = profile.hoTen.split(' ').filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase() || 'TK'
  const serviceStats = (Object.entries(stats.services) as Array<[ServiceType, number]>).filter(([, count]) => count > 0)
  const bestPromotion = promotions[0]

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const updated = await authApi.updateProfile({
        hoTen: profile.hoTen,
        soDienThoai: profile.soDienThoai,
        anhDaiDien: profile.anhDaiDien || undefined,
        diaChi: profile.diaChi || undefined,
      })
      setProfile(updated)
      setEditing(false)
      setNotice('Đã cập nhật hồ sơ thành công.')
    } catch (error) {
      setNotice(apiError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const menu = [
    ['personal', UserRound, 'Thông tin cá nhân'],
    ['journeys', History, 'Hành trình của tôi'],
    ['address', MapPin, 'Địa chỉ'],
  ] as const

  return <section className="customer-profile-v7">
    <div className="container customer-profile-v7-wrap">
      <div className="customer-profile-v7-breadcrumb"><Link to="/">Trang chủ</Link><span>›</span><b>Hồ sơ của tôi</b></div>
      <div className="customer-profile-v7-title">
        <div><h1>Hồ sơ của tôi</h1><p>Quản lý thông tin cá nhân, địa chỉ và lịch sử hành trình của bạn.</p></div>
        <div className="customer-profile-v7-status"><ShieldCheck/><span>Tài khoản<br/><b>{profile.trangThai === 'ACTIVE' ? 'Đang hoạt động' : profile.trangThai}</b></span></div>
      </div>

      {notice && <div className="customer-profile-v7-notice">{notice}</div>}

      <div className="customer-profile-v7-grid">
        <aside className="customer-profile-v7-nav card">
          <div className="customer-profile-v7-nav-user">
            <div className="customer-profile-v7-mini-avatar">{profile.anhDaiDien ? <img src={profile.anhDaiDien} alt=""/> : initials}</div>
            <div><b>{profile.hoTen}</b><small>{profile.email}</small></div>
          </div>
          <nav>
            {menu.map(([key, Icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon/><span>{label}</span><ChevronRight/></button>)}
          </nav>
          <button type="button" className="customer-profile-v7-logout" onClick={handleLogout}><LogOut/><span>Đăng xuất</span></button>
        </aside>

        <div className="customer-profile-v7-center">
          {tab === 'personal' && <form className="card customer-profile-v7-card" onSubmit={saveProfile}>
            <div className="customer-profile-v7-card-head">
              <div><h2>Thông tin cá nhân</h2><p>Dữ liệu lấy từ Auth Service.</p></div>
              {!editing && <button type="button" className="customer-profile-v7-outline" onClick={() => setEditing(true)}><Pencil/> Chỉnh sửa</button>}
            </div>

            <div className="customer-profile-v7-identity">
              <div className="customer-profile-v7-avatar">{profile.anhDaiDien ? <img src={profile.anhDaiDien} alt={profile.hoTen}/> : initials}</div>
              <div><h3>{profile.hoTen}</h3><p><CheckCircle2/> {profile.vaiTro === 'CUSTOMER' ? 'Khách hàng TAKIVIVU' : profile.vaiTro}</p><small>Mã tài khoản: TK{String(profile.id).padStart(6, '0')}</small></div>
            </div>

            <div className="customer-profile-v7-fields">
              <label><span>Họ và tên</span><input disabled={!editing} value={profile.hoTen} onChange={e => setProfile({...profile, hoTen: e.target.value})}/></label>
              <label><span>Email</span><input disabled value={profile.email}/></label>
              <label><span>Số điện thoại</span><input disabled={!editing} value={profile.soDienThoai || ''} placeholder="Chưa cập nhật" onChange={e => setProfile({...profile, soDienThoai: e.target.value})}/></label>
              <label><span>Trạng thái</span><input disabled value={profile.trangThai === 'ACTIVE' ? 'Đang hoạt động' : profile.trangThai}/></label>
              <label className="wide"><span>Địa chỉ</span><input disabled={!editing} value={profile.diaChi || ''} placeholder="Chưa cập nhật địa chỉ" onChange={e => setProfile({...profile, diaChi: e.target.value})}/></label>
              {editing && <label className="wide"><span>Ảnh đại diện (URL)</span><input value={profile.anhDaiDien || ''} placeholder="https://..." onChange={e => setProfile({...profile, anhDaiDien: e.target.value || null})}/></label>}
            </div>

            {editing && <div className="customer-profile-v7-actions"><button type="button" onClick={() => { setProfile(fallback || profile); setEditing(false) }}>Hủy</button><button className="primary" disabled={saving}><Save/>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>}
          </form>}

          {tab === 'journeys' && <div className="card customer-profile-v7-card"><div className="customer-profile-v7-card-head"><div><h2>Hành trình của tôi</h2><p>Các hành trình đã đặt của bạn.</p></div><Link to="/bookings">Xem tất cả</Link></div>{stats.validBookings.length ? <div className="customer-profile-v7-list">{stats.validBookings.slice(0, 6).map(booking => <Link key={booking.id} to={`/bookings/${booking.id}`}><span><b>{booking.maBooking}</b><small>{booking.danhSachDichVu?.map(item => serviceName[item.loaiDichVu]).join(' · ') || 'Dịch vụ du lịch'}</small></span><strong>{money(booking.tongTien)}</strong><ChevronRight/></Link>)}</div> : <EmptyState icon={<BriefcaseBusiness/>} title="Chưa có hành trình" text="Các đơn đặt dịch vụ của bạn sẽ xuất hiện tại đây."/>}</div>}

          {tab === 'address' && <div className="card customer-profile-v7-card"><div className="customer-profile-v7-card-head"><div><h2>Địa chỉ</h2><p>Địa chỉ liên hệ đang lưu trong Auth Service.</p></div><button type="button" className="customer-profile-v7-outline" onClick={() => { setTab('personal'); setEditing(true) }}><Pencil/> Chỉnh sửa</button></div><div className="customer-profile-v7-address"><MapPin/><span><b>Địa chỉ hiện tại</b><p>{profile.diaChi || 'Bạn chưa cập nhật địa chỉ.'}</p></span></div></div>}
        </div>

        <aside className="customer-profile-v7-right">
          <div className="card customer-profile-v7-side-card">
            <div className="customer-profile-v7-side-head"><b>Tài khoản</b><span>Auth Service</span></div>
            <div className="customer-profile-v7-member"><ShieldCheck/><div><strong>{profile.trangThai === 'ACTIVE' ? 'Đang hoạt động' : profile.trangThai}</strong><small>{profile.email}</small></div></div>
            <div className="customer-profile-v7-progress"><span style={{width: `${Math.min(100, stats.validBookings.length * 12)}%`}}/></div>
            <small>{stats.validBookings.length} đơn hợp lệ · Tổng chi tiêu: <b>{money(stats.spend)}</b></small>
          </div>

          <div className="card customer-profile-v7-side-card">
            <div className="customer-profile-v7-side-head"><b>Ưu đãi khả dụng</b><Link to="/promotions">Xem tất cả</Link></div>
            {bestPromotion ? <Link className="customer-profile-v7-promo" to={`/promotions/${bestPromotion.id}`}><Gift/><span><b>{promoLabel(bestPromotion)}</b><small>{bestPromotion.name}</small></span><ChevronRight/></Link> : <div className="customer-profile-v7-no-promo">Chưa có ưu đãi ACTIVE từ Promotion Service.</div>}
          </div>

          <div className="card customer-profile-v7-side-card">
            <div className="customer-profile-v7-side-head"><b>Thống kê nhanh</b><span>Backend</span></div>
            <div className="customer-profile-v7-stats">
              <span><BriefcaseBusiness/><b>{stats.validBookings.length}</b><small>Đơn dịch vụ</small></span>
              <span><CircleDollarSign/><b>{payments.filter(p => p.trangThai === 'SUCCESS').length}</b><small>Thanh toán</small></span>
              <span><BookOpenCheck/><b>{serviceStats.reduce((sum, [, count]) => sum + count, 0)}</b><small>Dịch vụ</small></span>
            </div>
          </div>

        </aside>
      </div>
    </div>
  </section>
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="customer-profile-v7-empty-state">{icon}<b>{title}</b><span>{text}</span></div>
}
