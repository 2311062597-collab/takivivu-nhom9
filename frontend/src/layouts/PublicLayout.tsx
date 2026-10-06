import { Bell, BriefcaseBusiness, ChevronDown, Facebook, Gift, Instagram, LogOut, Star, Twitter, UserRound, Youtube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { notificationApi } from '../api/services'
import { useAuth } from '../contexts/AuthContext'

export default function PublicLayout() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const initials = session?.hoTen?.split(' ').filter(Boolean).slice(-2).map(v => v[0]).join('').toUpperCase() || 'TK'

  useEffect(() => {
    if (!session) {
      setUnreadCount(0)
      return
    }

    let alive = true
    const refreshUnread = async () => {
      try {
        const notifications = await notificationApi.mine()
        if (alive) setUnreadCount(notifications.filter(item => !item.isRead).length)
      } catch {
        if (alive) setUnreadCount(0)
      }
    }

    void refreshUnread()
    const timer = window.setInterval(refreshUnread, 30000)
    const onChanged = () => void refreshUnread()
    window.addEventListener('takivivu:notifications-updated', onChanged)

    return () => {
      alive = false
      window.clearInterval(timer)
      window.removeEventListener('takivivu:notifications-updated', onChanged)
    }
  }, [session?.id, location.pathname])

  return <div className="site-shell public-reference-shell">
    <header className="topbar public-topbar public-reference-topbar customer-header-v7">
      <Link to="/" className="no-link"><Logo /></Link>

      <nav className="main-nav public-reference-nav">
        <NavLink to="/" end>Trang chủ</NavLink>
        <NavLink to="/flights">Chuyến bay</NavLink>
        <NavLink to="/hotels">Khách sạn</NavLink>
        <NavLink to="/attractions">Địa điểm tham quan</NavLink>
        <NavLink to="/promotions">Ưu đãi</NavLink>
        <NavLink to="/ai">AI trợ lý</NavLink>
      </nav>

      <div className="top-actions public-reference-actions customer-header-actions-v7">
        {session ? <>
          <Link
            className="public-notice customer-bell-v7"
            to="/notifications"
            title={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
            aria-label={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
          >
            <Bell size={21}/>
            {unreadCount > 0 && <span className="public-notice-count customer-bell-count-v7">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>

          {session.vaiTro === 'CUSTOMER' && <Link className="icon-link public-booking-link customer-booking-icon-v7" title="Đơn đặt dịch vụ" to="/bookings"><BriefcaseBusiness size={18}/></Link>}

          <div className="customer-user-menu-v7">
            <button
              type="button"
              className="public-user customer-user-v7 customer-user-trigger-v7"
              onClick={() => setUserMenuOpen(open => !open)}
              aria-expanded={userMenuOpen}
            >
              <span className="public-avatar customer-user-avatar-v7">{initials}</span>
              <span><strong>{session.hoTen}</strong><small>{session.vaiTro === 'PROVIDER' ? 'Nhà cung cấp' : session.vaiTro === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</small></span>
              <ChevronDown className={userMenuOpen ? 'open' : ''}/>
            </button>
            {userMenuOpen && <div className="customer-user-dropdown-v7">
              <Link to={session.vaiTro === 'PROVIDER' ? '/provider/profile' : '/profile'} onClick={() => setUserMenuOpen(false)}><UserRound/> Hồ sơ của tôi</Link>
              {session.vaiTro === 'CUSTOMER' && <><Link to="/bookings" onClick={() => setUserMenuOpen(false)}><BriefcaseBusiness/> Đơn đặt dịch vụ</Link><Link to="/my-reviews" onClick={() => setUserMenuOpen(false)}><Star/> Đánh giá của tôi</Link><Link to="/my-promotions" onClick={() => setUserMenuOpen(false)}><Gift/> Voucher của tôi</Link></>}
              <Link to="/notifications" onClick={() => setUserMenuOpen(false)}><Bell/> Thông báo{unreadCount > 0 ? ` (${unreadCount > 99 ? '99+' : unreadCount})` : ''}</Link>
              <button type="button" className="customer-user-logout-v7" onClick={async () => { setUserMenuOpen(false); await logout(); navigate('/login', { replace: true }) }}><LogOut/> Đăng xuất</button>
            </div>}
          </div>
        </> : <div className="public-auth-links"><Link to="/login">Đăng nhập</Link><Link className="btn btn-sm" to="/register">Đăng ký</Link></div>}
      </div>
    </header>

    <main className="customer-public-main-v7"><Outlet /></main>

    <footer className="public-site-footer">
      <div className="container public-footer-grid">
        <div className="public-footer-brand"><Logo compact/><p>Nền tảng đặt dịch vụ du lịch trực tuyến, đồng hành cùng bạn trên mọi hành trình.</p><small>© 2026 TAKIVIVU. All rights reserved.</small></div>
        <div><h4>Liên kết nhanh</h4><Link to="/flights">Chuyến bay</Link><Link to="/hotels">Khách sạn</Link><Link to="/attractions">Địa điểm tham quan</Link><Link to="/promotions">Ưu đãi</Link></div>
        <div><h4>Hỗ trợ khách hàng</h4><a href="#">Trung tâm trợ giúp</a><a href="#">Liên hệ</a><a href="#">Điều khoản dịch vụ</a><a href="#">Chính sách bảo mật</a></div>
        <div><h4>Kết nối với chúng tôi</h4><div className="public-socials"><Facebook/><Instagram/><Youtube/><Twitter/></div><h4 className="app-title">Tải ứng dụng</h4><div className="store-badges"><span>▶ <b>Google Play</b></span><span>● <b>App Store</b></span></div></div>
      </div>
      <div className="container public-footer-bottom"><span>Điều khoản sử dụng · Chính sách bảo mật</span><PlaneMark/></div>
    </footer>
  </div>
}

function PlaneMark(){return <span className="footer-plane-mark">✈</span>}
