import { ArrowLeft, Hotel, Landmark, MessageSquareText, Plane, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProviderReviewsPage() {
  const { session } = useAuth()
  const type = session?.loaiNhaCungCap
  const label = type === 'FLIGHT' ? 'chuyến bay' : type === 'HOTEL' ? 'khách sạn' : type === 'ATTRACTION' ? 'địa điểm tham quan' : 'dịch vụ'
  const Icon = type === 'FLIGHT' ? Plane : type === 'HOTEL' ? Hotel : Landmark

  return (
    <div className="provider-reviews-v2">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/profile">Hồ sơ nhà cung cấp</Link><span>›</span><strong>Đánh giá</strong></div>
      <div className="provider-reviews-heading">
        <div><h1>Đánh giá khách hàng</h1><p>Chỉ hiển thị đánh giá thuộc {label} của nhà cung cấp đang đăng nhập.</p></div>
        <Link to="/provider/profile" className="provider-reviews-back"><ArrowLeft/> Quay lại hồ sơ</Link>
      </div>

      <section className="provider-reviews-card">
        <div className="provider-reviews-type"><Icon/><span>Loại nhà cung cấp</span><strong>{type || 'PROVIDER'}</strong></div>
        <div className="provider-reviews-empty">
          <span className="provider-reviews-empty-icon"><MessageSquareText/></span>
          <div className="provider-reviews-stars"><Star/><Star/><Star/><Star/><Star/></div>
          <h2>Chưa có dữ liệu đánh giá</h2>
          <p>Project hiện chưa có Review Service/API đánh giá để lấy nhận xét thật từ backend. Trang này không tạo điểm số hoặc đánh giá giả.</p>
        </div>
      </section>
    </div>
  )
}
