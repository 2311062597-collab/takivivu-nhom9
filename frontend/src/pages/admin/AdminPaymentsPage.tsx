import { useEffect, useState } from 'react'
import { paymentApi } from '../../api/services'
import type { Payment, Refund } from '../../types'
import { apiError, money } from '../../utils/format'
export default function AdminPaymentsPage(){
 const [payments,setPayments]=useState<Payment[]>([]), [refunds,setRefunds]=useState<Refund[]>([]), [error,setError]=useState('');
 const load=async()=>{try{const [p,r]=await Promise.all([paymentApi.adminAll(),paymentApi.adminRefunds()]);setPayments(p);setRefunds(r)}catch(e){setError(apiError(e))}}; useEffect(()=>{void load()},[]);
 const confirm=async(r:Refund)=>{const code=window.prompt('Nhập mã giao dịch hoàn tiền:'); if(!code?.trim()) return; try{await paymentApi.confirmRefund(r.id,code.trim()); await load()}catch(e){setError(apiError(e))}};
 return <><h1>Thanh toán & hoàn tiền</h1>{error&&<div className="form-alert">{error}</div>}<h2>Yêu cầu hoàn tiền</h2><div className="admin-core-table"><table><thead><tr><th>Mã hoàn</th><th>Booking</th><th>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>{refunds.map(r=><tr key={r.id}><td>{r.maHoanTien}</td><td>#{r.bookingId}</td><td>{money(r.soTien)}</td><td>{r.lyDo}</td><td>{r.trangThai}</td><td>{r.trangThai==='PENDING'&&<button className="admin-core-action" onClick={()=>void confirm(r)}>Xác nhận hoàn</button>}</td></tr>)}</tbody></table></div><h2>Giao dịch</h2><div className="admin-core-table"><table><thead><tr><th>Mã thanh toán</th><th>Booking</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td>{p.maThanhToan}</td><td>{p.maBooking}</td><td>{money(p.soTien)}</td><td>{p.phuongThuc}</td><td>{p.trangThai}</td></tr>)}</tbody></table></div></>;
}
