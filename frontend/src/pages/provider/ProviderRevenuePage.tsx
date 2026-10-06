import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BedDouble, CalendarDays, CheckCircle2, CircleX, Coins, Eye, Landmark, Plane, ReceiptText } from 'lucide-react'
import { bookingApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Booking, BookingStatus } from '../../types'
import { apiError, money } from '../../utils/format'

const completed = new Set<BookingStatus>(['PAID','CONFIRMED','COMPLETED'])
const cancelled = new Set<BookingStatus>(['CANCELLED','EXPIRED','PAYMENT_FAILED','REFUNDED'])
function statusLabel(s:BookingStatus){return completed.has(s)?'Hoàn thành':cancelled.has(s)?'Đã hủy':s==='PENDING_PAYMENT'?'Chờ thanh toán':'Đang xử lý'}
function dateOnly(v?:string|null){return v?new Date(v).toLocaleDateString('vi-VN'):'—'}

export default function ProviderRevenuePage(){
  const {session}=useAuth(); const mode=session?.loaiNhaCungCap||'FLIGHT'; const providerId=session?.id
  const providerItems=(b:Booking)=>b.danhSachDichVu.filter(i=>i.nhaCungCapId===providerId)
  const providerAmount=(b:Booking)=>providerItems(b).reduce((sum,i)=>sum+Number(i.thanhTien||0),0)
  const [rows,setRows]=useState<Booking[]>([]); const [error,setError]=useState('')
  useEffect(()=>{bookingApi.providerMine().then(setRows).catch(e=>setError(apiError(e)))},[])
  const stats=useMemo(()=>{
    const total=rows.length, done=rows.filter(b=>completed.has(b.trangThai)).length, cancel=rows.filter(b=>cancelled.has(b.trangThai)).length
    const revenue=rows.filter(b=>completed.has(b.trangThai)).reduce((s,b)=>s+providerAmount(b),0)
    return {total,done,cancel,revenue,processing:Math.max(0,total-done-cancel)}
  },[rows])
  const modeLabel=mode==='FLIGHT'?'Chuyến bay':mode==='HOTEL'?'Khách sạn':'Địa điểm tham quan'
  const legend=[['Hoàn thành',stats.done,'#15a05a'],['Đang xử lý',stats.processing,'#f2b01e'],['Đã hủy',stats.cancel,'#f44336']] as const
  let acc=0; const gradient=stats.total?legend.map(([,v,c])=>{const st=acc;acc+=v/stats.total*100;return `${c} ${st}% ${acc}%`}).join(','):'#e9f0f6 0 100%'
  return <div className="provider-revenue-v2">
    <div className="provider-v2-breadcrumbs"><span>Trang chủ</span><span>›</span><span>Thống kê &amp; Doanh thu</span><span>›</span><strong>{modeLabel}</strong></div>
    <div className="revenue-topline"><div><h1>Thống kê &amp; Doanh thu</h1><p>Số liệu chỉ tính các đơn thuộc tài khoản nhà cung cấp đang đăng nhập.</p></div><button className="revenue-date"><CalendarDays/><span>Tất cả thời gian</span></button></div>
    {error&&<div className="form-alert">{error}</div>}
    <div className="revenue-tabs"><button className="active">{mode==='FLIGHT'?<Plane/>:mode==='HOTEL'?<BedDouble/>:<Landmark/>}{modeLabel}</button></div>
    <div className="revenue-stats">
      <div className="revenue-stat"><span className="ico purple"><ReceiptText/></span><div><small>Tổng số đơn</small><strong>{stats.total}</strong><p>Đơn của provider hiện tại</p></div></div>
      <div className="revenue-stat"><span className="ico orange"><Coins/></span><div><small>Tổng doanh thu</small><strong>{money(stats.revenue)}</strong><p>Từ đơn đã hoàn tất/xác nhận</p></div></div>
      <div className="revenue-stat"><span className="ico green"><CheckCircle2/></span><div><small>Đơn hoàn thành</small><strong>{stats.done}</strong><p>Provider hiện tại</p></div></div>
      <div className="revenue-stat"><span className="ico red"><CircleX/></span><div><small>Đơn hủy</small><strong>{stats.cancel}</strong><p>Provider hiện tại</p></div></div>
    </div>
    <div className="revenue-charts-grid"><section className="revenue-panel"><h3><BarChart3/> Tổng quan doanh thu</h3><div className="chart-empty"><strong style={{fontSize:28}}>{money(stats.revenue)}</strong><span>{stats.total} đơn của {modeLabel.toLowerCase()}</span></div></section><section className="revenue-panel revenue-donut-panel"><h3><BarChart3/> Tỷ lệ trạng thái đơn</h3><div className="revenue-donut-wrap"><div className="revenue-donut" style={{background:`conic-gradient(${gradient})`}}><div><span>{stats.total}</span><span>đơn</span></div></div><div className="revenue-donut-legend">{legend.map(([l,v,c])=><div key={l}><i style={{background:c}}/><span>{l}</span><b>{v}</b></div>)}</div></div></section></div>
    <section className="revenue-panel revenue-table-panel"><div className="revenue-table-head"><h3><ReceiptText/> Danh sách đơn của nhà cung cấp</h3></div><div className="revenue-table-scroll"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Ngày sử dụng</th><th>Số lượng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{rows.length===0?<tr><td colSpan={8} style={{textAlign:'center',padding:40}}>Nhà cung cấp này chưa có đơn đặt dịch vụ.</td></tr>:rows.map(b=>{const item=providerItems(b)[0];return <tr key={b.id}><td><b className="revenue-code">{b.maBooking}</b></td><td>KH #{b.khachHangId}</td><td>{modeLabel} #{item?.dichVuId||'—'}</td><td>{dateOnly(item?.ngayBatDau)}</td><td>{item?.soLuong||0}</td><td><b>{money(providerAmount(b))}</b></td><td>{statusLabel(b.trangThai)}</td><td><button className="revenue-view"><Eye/></button></td></tr>})}</tbody></table></div><div className="revenue-pagination"><span>Hiển thị {rows.length} đơn</span></div></section>
  </div>
}
