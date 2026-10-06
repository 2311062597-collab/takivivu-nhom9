import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Plane,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { attractionApi, bookingApi, flightApi, hotelApi, notificationApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Booking, BookingStatus, NotificationItem } from '../../types'
import { money } from '../../utils/format'

export default function ProviderDashboardPage() {
  const { session } = useAuth()
  const displayName = session?.hoTen || 'Nguyễn Văn An'
  const [orders,setOrders]=useState<Booking[]>([])
  const [notifications,setNotifications]=useState<NotificationItem[]>([])
  const providerId=session?.id
  const providerItems=(b:Booking)=>b.danhSachDichVu.filter(i=>i.nhaCungCapId===providerId)
  const providerAmount=(b:Booking)=>providerItems(b).reduce((sum,i)=>sum+Number(i.thanhTien||0),0)
  const [serviceCount,setServiceCount]=useState(0)
  useEffect(()=>{ bookingApi.providerMine().then(setOrders).catch(()=>setOrders([])); notificationApi.mine().then(setNotifications).catch(()=>setNotifications([])); const req=session?.loaiNhaCungCap==='HOTEL'?hotelApi.mine():session?.loaiNhaCungCap==='ATTRACTION'?attractionApi.mine():flightApi.mine(); req.then(x=>setServiceCount(x.length)).catch(()=>setServiceCount(0)) },[session?.loaiNhaCungCap])
  const doneStatuses=new Set<BookingStatus>(['PAID','CONFIRMED','COMPLETED'])
  const cancelledStatuses=new Set<BookingStatus>(['CANCELLED','EXPIRED','PAYMENT_FAILED','REFUNDED'])
  const revenue=useMemo(()=>orders.filter(x=>doneStatuses.has(x.trangThai)).reduce((n,x)=>n+providerAmount(x),0),[orders])
  const customerCount=useMemo(()=>new Set(orders.map(x=>x.khachHangId)).size,[orders])
  const done=orders.filter(x=>doneStatuses.has(x.trangThai)).length, cancelled=orders.filter(x=>cancelledStatuses.has(x.trangThai)).length, pending=Math.max(0,orders.length-done-cancelled)

  return (
    <div className="provider-dashboard-v2">
      <section className="provider-v2-welcome-row">
        <div>
          <h1>Xin chào, {displayName}!</h1>
          <p>Cùng TAKIVIVU kết nối hàng triệu khách hàng, lan tỏa trải nghiệm du lịch tuyệt vời.</p>
        </div>
        <button className="provider-v2-date"><CalendarDays /> Hôm nay, 15/08/2026 <span>⌄</span></button>
      </section>

      <section className="provider-dashboard-stats">
        <div className="provider-dashboard-stat blue"><span className="icon"><BriefcaseBusiness /></span><div><small>Tổng đơn đặt dịch vụ</small><strong>{orders.length}</strong><em><i>Provider hiện tại</i></em></div></div>
        <div className="provider-dashboard-stat green"><span className="icon"><CircleDollarSign /></span><div><small>Doanh thu</small><strong>{money(revenue)}</strong><em><i>Provider hiện tại</i></em></div></div>
        <div className="provider-dashboard-stat orange"><span className="icon"><UserRound /></span><div><small>Khách hàng</small><strong>{customerCount}</strong><em><i>Khách đã đặt dịch vụ</i></em></div></div>
        <div className="provider-dashboard-stat purple"><span className="icon"><PackageCheck /></span><div><small>Dịch vụ đang cung cấp</small><strong>{serviceCount}</strong><em><i>Dịch vụ của provider</i></em></div></div>
      </section>

      <section className="provider-dashboard-upper-grid">
        <article className="provider-v2-card provider-revenue-card">
          <div className="provider-v2-card-head"><h3>Doanh thu theo ngày</h3><select defaultValue="7"><option value="7">7 ngày gần nhất</option></select></div>
          <div className="provider-revenue-chart">
            <div className="chart-y-axis"><span>20M</span><span>15M</span><span>10M</span><span>5M</span><span>0</span></div>
            <div className="chart-canvas">
              <div className="chart-grid-lines"><i/><i/><i/><i/><i/></div>
              <svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Biểu đồ doanh thu">
                <defs>
                  <linearGradient id="providerArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2d8dff" stopOpacity=".28"/><stop offset="1" stopColor="#2d8dff" stopOpacity=".02"/></linearGradient>
                </defs>
                <path d="M0 154 L112 103 L224 116 L336 75 L448 103 L560 61 L700 93 L700 180 L0 180 Z" fill="url(#providerArea)" />
                <polyline points="0,154 112,103 224,116 336,75 448,103 560,61 700,93" fill="none" stroke="#2487ff" strokeWidth="3" />
                {[['0','154'],['112','103'],['224','116'],['336','75'],['448','103'],['560','61'],['700','93']].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="4" fill="#fff" stroke="#2487ff" strokeWidth="3" />)}
              </svg>
              <div className="chart-x-axis"><span>09/08</span><span>10/08</span><span>11/08</span><span>12/08</span><span>13/08</span><span>14/08</span><span>15/08</span></div>
            </div>
          </div>
        </article>

        <article className="provider-v2-card provider-service-ratio-card">
          <div className="provider-v2-card-head"><h3>Tỷ lệ đơn theo loại dịch vụ</h3></div>
          <div className="service-ratio-content">
            <div className="service-donut"><div><strong>{orders.length}</strong><span>đơn hàng</span></div></div>
            <div className="service-ratio-legend">
              <p><i className="dot flight"/><span>{session?.loaiNhaCungCap === 'HOTEL'?'Khách sạn':session?.loaiNhaCungCap==='ATTRACTION'?'Địa điểm tham quan':'Chuyến bay'}</span><strong>{orders.length} (100%)</strong></p>
            </div>
          </div>
        </article>
      </section>

      <section className="provider-dashboard-middle-grid">
        <article className="provider-v2-card provider-booking-status-card">
          <h3>Tình trạng đơn đặt dịch vụ</h3>
          <div className="booking-status-grid">
            <div><span className="green"><CheckCircle2 /></span><small>Đã xác nhận</small><strong>{done}</strong></div>
            <div><span className="blue"><Clock3 /></span><small>Chờ xác nhận</small><strong>{pending}</strong></div>
            <div><span className="orange"><PackageCheck /></span><small>Đang sử dụng</small><strong>{pending}</strong></div>
            <div><span className="red"><XCircle /></span><small>Đã hủy</small><strong>{cancelled}</strong></div>
          </div>
        </article>
        <article className="provider-promo-card">
          <div><strong>Cùng TAKIVIVU<br/>mang thế giới đến gần hơn</strong><p>Quảng bá dịch vụ của bạn<br/>Tạo nên những hành trình đáng nhớ</p></div>
          <Plane />
        </article>
      </section>

      <section className="provider-dashboard-lower-grid">
        <article className="provider-v2-card provider-recent-orders">
          <div className="provider-v2-card-head"><h3>Đơn đặt dịch vụ gần đây</h3><button>Xem tất cả →</button></div>
          <div className="provider-dashboard-table-wrap">
            <table className="provider-dashboard-table">
              <thead><tr><th>#</th><th>Mã đơn</th><th>Khách hàng</th><th>Loại dịch vụ</th><th>Dịch vụ</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
              <tbody>{orders.slice(0,5).map((b,index)=>{const item=providerItems(b)[0];return <tr key={b.id}><td>{index+1}</td><td>{b.maBooking}</td><td>KH #{b.khachHangId}</td><td><span className="service-pill flight">{item?.loaiDichVu||session?.loaiNhaCungCap}</span></td><td>#{item?.dichVuId||'—'}</td><td>{item?.ngayBatDau?new Date(item.ngayBatDau).toLocaleDateString('vi-VN'):'—'}</td><td>{money(providerAmount(b))}</td><td><span className={`order-status ${cancelledStatuses.has(b.trangThai)?'cancelled':doneStatuses.has(b.trangThai)?'confirmed':'using'}`}>{doneStatuses.has(b.trangThai)?'Hoàn thành':cancelledStatuses.has(b.trangThai)?'Đã hủy':'Đang xử lý'}</span></td></tr>})}</tbody>
            </table>
          </div>
        </article>

        <article className="provider-v2-card provider-dashboard-notifications">
          <div className="provider-v2-card-head"><h3>Thông báo mới</h3><button>Xem tất cả →</button></div>
          {notifications.slice(0,4).map(n=><div key={n.id} className="dashboard-notification blue"><span><Bell/></span><div><strong>{n.title}</strong><p>{n.message}</p></div><small>{new Date(n.createdAt).toLocaleString('vi-VN')}</small></div>)}
          {!notifications.length&&<div className="order-empty">Chưa có thông báo mới.</div>}
        </article>
      </section>
    </div>
  )
}
