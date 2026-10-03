import { CalendarDays, ChevronLeft, ChevronRight, Eye, Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookingApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Booking } from '../../types'
import { apiError, dateOnly, money } from '../../utils/format'
import { bookingStatusLabel, bookingStatusTone, serviceTypeLabel } from '../../utils/bookingPresentation'

export default function ProviderOrdersPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const providerId = session?.id
  const providerItem = (order: Booking) => order.danhSachDichVu?.find(item => item.nhaCungCapId === providerId)
  const providerTotal = (order: Booking) => order.danhSachDichVu?.filter(item=>item.nhaCungCapId===providerId).reduce((sum,item)=>sum+Number(item.thanhTien||0),0) || 0
  const [rows,setRows]=useState<Booking[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  const [status,setStatus]=useState(''),[date,setDate]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1)
  const perPage=10
  useEffect(()=>{bookingApi.providerMine().then(setRows).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[])
  const shown=useMemo(()=>rows.filter(order=>{
    const item=providerItem(order)
    const haystack=`${order.maBooking} ${order.khachHangId} ${item?.loaiDichVu||''} ${item?.dichVuId||''}`.toLowerCase()
    return (!status||order.trangThai===status)&&(!date||item?.ngayBatDau===date)&&(!query||haystack.includes(query.toLowerCase()))
  }),[rows,status,date,query])
  useEffect(()=>setPage(1),[status,date,query])
  const pages=Math.max(1,Math.ceil(shown.length/perPage)), current=Math.min(page,pages), list=shown.slice((current-1)*perPage,current*perPage)
  return <div className="provider-orders-v2"><div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Đơn đặt dịch vụ</strong></div>
    <section className="order-list-heading"><div><h1>Đơn đặt dịch vụ</h1><p>Chỉ hiển thị đơn thuộc dịch vụ của nhà cung cấp hiện tại. Đơn chỉ xuất hiện sau khi khách xác nhận đã chuyển khoản; Provider kiểm tra và xác nhận thanh toán.</p></div></section>
    <section className="order-list-card"><div className="order-filter-row">
      <label><span>Trạng thái</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Tất cả</option><option value="PAYMENT_RECEIVED">Chờ xác nhận thanh toán</option><option value="PAID">Đã thanh toán</option><option value="CONFIRMED">Đã xác nhận</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option><option value="CANCEL_REQUESTED">Yêu cầu hủy/hoàn tiền</option><option value="REFUND_PENDING">Đang hoàn tiền</option><option value="REFUNDED">Đã hoàn tiền</option></select></label>
      <label><span>Ngày sử dụng</span><div className="order-date-field"><CalendarDays/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div></label>
      <div className="order-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm mã đơn, khách hàng, dịch vụ..."/></div><button className="order-filter-button"><Filter/> Lọc</button></div>
      {error&&<div className="form-alert">{error}</div>}{loading?<div className="order-empty">Đang tải đơn từ Booking Service...</div>:<div className="order-table-wrap"><table className="order-table"><thead><tr><th>STT</th><th>Mã đơn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Ngày sử dụng</th><th>Số lượng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.map((order,index)=>{const item=providerItem(order);return <tr key={order.id}><td>{(current-1)*perPage+index+1}</td><td><strong className="order-code">{order.maBooking}</strong></td><td>#{order.khachHangId}</td><td>{item?`${serviceTypeLabel(item.loaiDichVu)} #${item.dichVuId}`:'—'}</td><td>{item?.ngayBatDau?dateOnly(item.ngayBatDau):'—'}</td><td>{item?.soLuong||0}</td><td><strong>{money(providerTotal(order))}</strong></td><td><span className={`booking-status-v3 ${bookingStatusTone(order.trangThai)}`}>{bookingStatusLabel(order.trangThai)}</span></td><td><button className="order-view" onClick={()=>navigate(`/provider/orders/${order.id}`)}><Eye/></button></td></tr>})}</tbody></table>{!list.length&&<div className="order-empty">Không có đơn phù hợp.</div>}</div>}
      <div className="order-pagination"><span>Hiển thị {shown.length?(current-1)*perPage+1:0} - {Math.min(current*perPage,shown.length)} của {shown.length} đơn</span><div><button disabled={current<=1} onClick={()=>setPage(v=>v-1)}><ChevronLeft/></button>{Array.from({length:Math.min(5,pages)},(_,i)=>i+1).map(n=><button key={n} className={current===n?'active':''} onClick={()=>setPage(n)}>{n}</button>)}<button disabled={current>=pages} onClick={()=>setPage(v=>v+1)}><ChevronRight/></button></div></div>
    </section></div>
}
