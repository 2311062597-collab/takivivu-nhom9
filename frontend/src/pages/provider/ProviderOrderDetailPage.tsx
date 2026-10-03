import { ArrowLeft, CalendarDays, ClipboardList, UserRound, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Booking } from '../../types'
import { apiError, dateOnly, money } from '../../utils/format'
import { bookingStatusLabel, bookingStatusTone, serviceTypeLabel } from '../../utils/bookingPresentation'

export default function ProviderOrderDetailPage(){
 const navigate=useNavigate(),{id=''}=useParams(); const {session}=useAuth(); const [order,setOrder]=useState<Booking|null>(null),[error,setError]=useState(''),[confirming,setConfirming]=useState(false),[rejectReason,setRejectReason]=useState(''),[cancellationAction,setCancellationAction]=useState<'approve'|'reject'|null>(null),[now,setNow]=useState(Date.now())
 useEffect(()=>{const n=Number(id); if(!Number.isFinite(n)){setError('Mã đơn không hợp lệ');return} bookingApi.detail(n).then(setOrder).catch(e=>setError(apiError(e)))},[id])
 useEffect(()=>{const timer=window.setInterval(()=>{setNow(Date.now()); if(Number.isFinite(Number(id))) bookingApi.detail(Number(id)).then(setOrder).catch(()=>{})},5000);return()=>window.clearInterval(timer)},[id])
 if(error)return <div className="provider-order-detail-v2"><div className="form-alert">{error}</div><button onClick={()=>navigate('/provider/orders')}><ArrowLeft/> Quay lại</button></div>
 if(!order)return <div className="provider-order-detail-v2">Đang tải chi tiết đơn...</div>
 const providerItems=order.danhSachDichVu?.filter(i=>i.nhaCungCapId===session?.id)||[]
 const providerTotal=providerItems.reduce((sum,i)=>sum+Number(i.thanhTien||0),0)
 const remainingSeconds=order.hetHanThanhToan?Math.max(0,Math.ceil((new Date(order.hetHanThanhToan).getTime()-now)/1000)):0
 const resolveCancellation=async(approved:boolean)=>{
   if(!approved&&!rejectReason.trim()){setError('Vui lòng nhập lý do từ chối trước khi tiếp tục.');return}
   setConfirming(true);setError('');try{
     setOrder(await bookingApi.resolveCancellation(order.id,approved,approved?'':rejectReason.trim()));setCancellationAction(null);setRejectReason('');
   }catch(e){setError(apiError(e))}finally{setConfirming(false)}
 }
 const confirmPayment=async()=>{setConfirming(true);setError('');try{setOrder(await bookingApi.providerConfirmPayment(order.id))}catch(e){setError(apiError(e))}finally{setConfirming(false)}}
 return <div className="provider-order-detail-v2"><div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/orders">Đơn đặt dịch vụ</Link><span>›</span><strong>Chi tiết đơn</strong></div>
 <section className="order-detail-heading"><div><h1>Chi tiết đơn đặt dịch vụ</h1><p>Dữ liệu thật từ Booking Service.</p></div><button onClick={()=>navigate('/provider/orders')}><ArrowLeft/> Quay lại danh sách</button></section>
 <div className="order-detail-layout"><main className="order-detail-main"><section className="order-code-card"><div><ClipboardList/><div><strong>Mã đơn: {order.maBooking}</strong><small>Khách hàng #{order.khachHangId}</small></div></div><div className="provider-payment-confirm-wrap"><span className={`booking-status-v3 ${bookingStatusTone(order.trangThai)}`}>{bookingStatusLabel(order.trangThai)}</span>{order.trangThai==='PAYMENT_RECEIVED'&&<><span role="status">Còn {Math.floor(remainingSeconds/60)}:{String(remainingSeconds%60).padStart(2,'0')} để đối soát</span><button className="provider-confirm-payment-btn" disabled={confirming||remainingSeconds===0} onClick={confirmPayment}>{confirming?'Đang xác nhận...':'Xác nhận thanh toán'}</button></>}</div></section>
 {order.trangThai==='CANCEL_REQUESTED' && <section className="order-info-card cancellation-panel" aria-label="Xử lý yêu cầu hủy và hoàn tiền">
   <div className="cancellation-panel-heading"><div><h3>Yêu cầu hủy và hoàn tiền</h3><p>Kiểm tra thông tin trước khi đưa ra quyết định.</p></div><span className="cancellation-pending">Chờ xử lý</span></div>
   <div className="cancellation-details"><div><span>Lý do khách hàng</span><strong>{order.lyDoHuy||'Không có lý do'}</strong></div><div><span>Hạn xử lý</span><strong>{order.hanXuLyHuy ? new Date(order.hanXuLyHuy).toLocaleString('vi-VN') : '—'}</strong></div></div>
   {error&&<p className="cancellation-error" role="alert">{error}</p>}
   {!cancellationAction ? <div className="cancellation-actions">
     <button type="button" className="cancellation-btn cancellation-approve" disabled={confirming} onClick={()=>{setError('');setCancellationAction('approve')}}><CheckCircle2 size={17}/> Duyệt hủy và hoàn tiền</button>
     <button type="button" className="cancellation-btn cancellation-reject" disabled={confirming} onClick={()=>{setError('');setCancellationAction('reject')}}><XCircle size={17}/> Từ chối yêu cầu</button>
   </div> : <div className="cancellation-confirm-box">
     <h4>{cancellationAction==='approve'?'Xác nhận duyệt yêu cầu':'Xác nhận từ chối yêu cầu'}</h4>
     <p>{cancellationAction==='approve'?'Bạn có chắc chắn muốn duyệt hủy và thực hiện quy trình hoàn tiền theo cấu hình hệ thống?':'Vui lòng nêu rõ lý do để khách hàng biết vì sao yêu cầu không được chấp nhận.'}</p>
     {cancellationAction==='reject'&&<div className="cancellation-reason-field"><label htmlFor="cancellation-reject-reason">Lý do từ chối <span aria-hidden="true">*</span></label><textarea id="cancellation-reject-reason" value={rejectReason} maxLength={500} rows={3} onChange={e=>{setRejectReason(e.target.value);setError('')}} placeholder="Nhập lý do từ chối yêu cầu..." aria-required="true"/><small>{rejectReason.length}/500 ký tự</small></div>}
     <div className="cancellation-actions"><button type="button" className={`cancellation-btn ${cancellationAction==='approve'?'cancellation-approve':'cancellation-reject'}`} disabled={confirming||cancellationAction==='reject'&&!rejectReason.trim()} onClick={()=>resolveCancellation(cancellationAction==='approve')}>{confirming?'Đang xử lý...':cancellationAction==='approve'?'Xác nhận duyệt':'Xác nhận từ chối'}</button><button type="button" className="cancellation-btn cancellation-back" disabled={confirming} onClick={()=>{setCancellationAction(null);setError('')}}>Quay lại</button></div>
   </div>}
 </section>}
 <div className="order-detail-two-cols"><section className="order-info-card"><h3><UserRound/> Thông tin khách hàng</h3><dl><div><dt>ID khách hàng</dt><dd>#{order.khachHangId}</dd></div></dl></section><section className="order-info-card"><h3><CalendarDays/> Dịch vụ</h3><dl>{providerItems.map(i=><div key={i.id}><dt>{serviceTypeLabel(i.loaiDichVu)} #{i.dichVuId}</dt><dd>{i.ngayBatDau?dateOnly(i.ngayBatDau):'—'}</dd></div>)}</dl></section></div>
 <section className="order-items-card"><h3><ClipboardList/> Chi tiết đặt dịch vụ</h3><table><thead><tr><th>STT</th><th>Dịch vụ</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead><tbody>{providerItems.map((i,n)=><tr key={i.id}><td>{n+1}</td><td>{serviceTypeLabel(i.loaiDichVu)} #{i.dichVuId}</td><td>{money(i.donGia)}</td><td>{i.soLuong}</td><td><strong>{money(i.thanhTien)}</strong></td></tr>)}</tbody><tfoot><tr><td colSpan={4}>Tổng tiền</td><td>{money(providerTotal)}</td></tr></tfoot></table></section></main></div></div>
}
