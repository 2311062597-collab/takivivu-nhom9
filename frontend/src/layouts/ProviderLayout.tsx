import HotelProfileGate from '../routes/HotelProfileGate'
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  DoorOpen,
  LayoutDashboard,
  BedDouble,
  MapPinned,
  Plane,
  Ticket,
  Tags,
  UserRound,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProviderBrand() {
  return (
    <Link to="/provider" className="provider-brand">
      <span className="provider-brand-mark"><Plane /></span>
      <span className="provider-brand-copy">
        <strong>TAKIVIVU</strong>
        <small>PROVIDER</small>
      </span>
    </Link>
  )
}

function headerFor(pathname: string, displayName: string) {
  if (pathname === '/provider') return {
    title: `Xin chào, ${displayName}!`,
    subtitle: 'Cùng TAKIVIVU kết nối hàng triệu khách hàng, lan tỏa trải nghiệm du lịch tuyệt vời.',
  }

  if (pathname === '/provider/flights/new') return { title: 'Thêm chuyến bay', subtitle: 'Vui lòng nhập đầy đủ thông tin để tạo chuyến bay mới.' }
  if (/^\/provider\/flights\/\d+\/edit$/.test(pathname)) return { title: 'Sửa chuyến bay', subtitle: 'Cập nhật thông tin chuyến bay.' }
  if (pathname.startsWith('/provider/flights')) return { title: 'Quản lý chuyến bay', subtitle: 'Quản lý danh sách chuyến bay, cập nhật thông tin, giá vé và số ghế.' }


  if (pathname.includes('/rooms/new')) return { title: 'Thêm phòng', subtitle: 'Tạo phòng mới cho khách sạn của bạn.' }
  if (pathname.startsWith('/provider/rooms')) return { title: 'Danh sách phòng', subtitle: 'Quản lý các phòng thuộc khách sạn của bạn.' }

  if (pathname === '/provider/attractions/new') return { title: 'Thêm địa điểm tham quan', subtitle: 'Tạo mới địa điểm tham quan trên hệ thống.' }
  if (/^\/provider\/attractions\/\d+\/edit$/.test(pathname)) return { title: 'Sửa địa điểm tham quan', subtitle: 'Cập nhật thông tin địa điểm tham quan.' }
  if (/^\/provider\/attractions\/\d+$/.test(pathname)) return { title: 'Chi tiết địa điểm tham quan', subtitle: 'Theo dõi thông tin, vị trí và dịch vụ của địa điểm.' }
  if (pathname.startsWith('/provider/attractions')) return { title: 'Danh sách địa điểm tham quan', subtitle: 'Quản lý các địa điểm tham quan bạn cung cấp.' }

  if (pathname === '/provider/tickets/new') return { title: 'Thêm loại vé', subtitle: 'Tạo loại vé cho địa điểm tham quan của bạn.' }
  if (/^\/provider\/tickets\/\d+\/edit$/.test(pathname)) return { title: 'Sửa loại vé', subtitle: 'Cập nhật giá, số lượng và thời hạn sử dụng của vé.' }
  if (/^\/provider\/tickets\/\d+$/.test(pathname)) return { title: 'Chi tiết vé', subtitle: 'Xem thông tin loại vé tham quan.' }
  if (pathname.startsWith('/provider/tickets')) return { title: 'Danh sách vé', subtitle: 'Quản lý các loại vé tham quan tại các địa điểm bạn cung cấp.' }

  if (/^\/provider\/orders\/\d+$/.test(pathname)) return { title: 'Chi tiết đơn đặt dịch vụ', subtitle: 'Theo dõi thông tin và trạng thái đơn thuộc dịch vụ của bạn.' }
  if (pathname.startsWith('/provider/orders')) return { title: 'Đơn đặt dịch vụ', subtitle: 'Theo dõi các đơn đặt thuộc dịch vụ của nhà cung cấp hiện tại.' }

  if (pathname === '/provider/promotions/new') return { title: 'Tạo ưu đãi mới', subtitle: 'Nhập thông tin để tạo chương trình ưu đãi mới.' }
  if (/^\/provider\/promotions\/\d+\/edit$/.test(pathname)) return { title: 'Cập nhật ưu đãi', subtitle: 'Chỉnh sửa thông tin chương trình ưu đãi.' }
  if (/^\/provider\/promotions\/\d+$/.test(pathname)) return { title: 'Chi tiết ưu đãi', subtitle: 'Xem thông tin chương trình ưu đãi.' }
  if (pathname.startsWith('/provider/promotions')) return { title: 'Quản lý ưu đãi', subtitle: 'Tạo và quản lý các chương trình ưu đãi dành cho dịch vụ của bạn.' }

  if (pathname.startsWith('/provider/revenue')) return { title: 'Thống kê & Doanh thu', subtitle: 'Số liệu chỉ tính các đơn thuộc tài khoản nhà cung cấp đang đăng nhập.' }
  if (pathname.startsWith('/provider/reviews')) return { title: 'Đánh giá khách hàng', subtitle: 'Theo dõi đánh giá dành cho dịch vụ của bạn.' }
  if (pathname.startsWith('/provider/notifications')) return { title: 'Thông báo', subtitle: 'Theo dõi các cập nhật mới liên quan đến hoạt động kinh doanh.' }
  if (pathname.startsWith('/provider/profile')) return { title: 'Hồ sơ nhà cung cấp', subtitle: 'Cập nhật thông tin nhà cung cấp và khách sạn.' }

  return { title: 'Nhà cung cấp', subtitle: 'Quản lý dịch vụ của bạn trên TAKIVIVU.' }
}

export default function ProviderLayout() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const displayName = session?.hoTen || 'Nhà cung cấp'
  const header = headerFor(location.pathname, displayName)

  return (
    <div className="provider-shell provider-v2-shell">
      <aside className="sidebar provider-v2-sidebar">
        <ProviderBrand />

        <nav className="provider-v2-menu">
          <NavLink end to="/provider" className="provider-v2-menu-link">
            <LayoutDashboard /> <span>Tổng quan</span>
          </NavLink>

          {session?.loaiNhaCungCap === 'FLIGHT' && (
            <NavLink to="/provider/flights" className="provider-v2-menu-link">
              <Plane /> <span>Quản lý chuyến bay</span>
            </NavLink>
          )}

          {session?.loaiNhaCungCap === 'HOTEL' && (
            <>
              <NavLink to="/provider/room-types" className="provider-v2-menu-link"><BedDouble /> <span>Quản lý loại phòng</span></NavLink>
              <NavLink to="/provider/rooms" className="provider-v2-menu-link">
                <Building2 /> <span>Quản lý phòng</span>
              </NavLink>
            </>
          )}
          {session?.loaiNhaCungCap === 'ATTRACTION' && (
            <NavLink to="/provider/attractions" className="provider-v2-menu-link">
              <MapPinned /> <span>Quản lý địa điểm tham quan</span>
            </NavLink>
          )}
          {session?.loaiNhaCungCap === 'ATTRACTION' && (
            <NavLink to="/provider/tickets" className="provider-v2-menu-link">
              <Ticket /> <span>Quản lý vé</span>
            </NavLink>
          )}

          <NavLink to="/provider/orders" className="provider-v2-menu-link">
            <BriefcaseBusiness /> <span>Đơn đặt dịch vụ</span>
          </NavLink>
          <NavLink to="/provider/promotions" className="provider-v2-menu-link">
            <Tags /> <span>Quản lý ưu đãi</span>
          </NavLink>
          <NavLink to="/provider/revenue" className="provider-v2-menu-link">
            <BarChart3 /> <span>Thống kê &amp; Doanh thu</span>
          </NavLink>
          <NavLink to="/provider/notifications" className="provider-v2-menu-link provider-v2-notification-link">
            <Bell /> <span>Thông báo</span>
          </NavLink>
          <NavLink to="/provider/profile" className="provider-v2-menu-link"><UserRound /> <span>Hồ sơ nhà cung cấp</span></NavLink>
        </nav>

        <button className="provider-v2-logout" onClick={() => void logout()}><DoorOpen /> <span>Đăng xuất</span></button>
      </aside>

      <section className="provider-main provider-v2-main">
        <header className="provider-header provider-v2-header">
          <div className="provider-v2-header-copy">
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
          <div className="provider-v2-header-actions">
            <div className="provider-v2-user-chip">
              <span className="provider-v2-avatar"><UserRound /></span>
              <div>
                <strong>{displayName}</strong>
                <small>Nhà cung cấp</small>
              </div>
            </div>
          </div>
        </header>
        <div className="provider-content provider-v2-content"><HotelProfileGate><Outlet /></HotelProfileGate></div>
      </section>
    </div>
  )
}
