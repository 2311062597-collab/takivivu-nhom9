import { useEffect, useState } from 'react'
import { bookingApi } from '../../api/services'
import type { Booking } from '../../types'
import { apiError, money } from '../../utils/format'
export default function AdminBookingsPage(){
 const [rows,setRows]=useState<Booking[]>([]); const [error,setError]=useState('');
 const load=()=>bookingApi.adminAll().then(setRows).catch(e=>setError(apiError(e))); useEffect(()=>{void load()},[]);
 return <><h1>Booking toàn hệ thống</h1>{error&&<div className="form-alert">{error}</div>}<div className="admin-core-table"><table><thead><tr><th>Mã booking</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.maBooking}</td><td>#{r.khachHangId}</td><td>{money(r.tongTien)}</td><td><b>{r.trangThai}</b></td></tr>)}</tbody></table></div></>;
}
