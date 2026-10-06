import { useEffect, useState } from 'react'
import { authApi } from '../../api/services'
import type { AdminDashboard } from '../../types'
import { apiError } from '../../utils/format'
export default function AdminDashboardPage(){
 const [data,setData]=useState<AdminDashboard|null>(null); const [error,setError]=useState('');
 useEffect(()=>{authApi.adminDashboard().then(setData).catch(e=>setError(apiError(e)))},[]);
 if(error) return <div className="form-alert">{error}</div>; if(!data) return <p>Đang tải thống kê...</p>;
 const cards=[['Tổng người dùng',data.tongNguoiDung],['Khách hàng',data.tongKhachHang],['Nhà cung cấp',data.tongNhaCungCap],['NCC chờ duyệt',data.nhaCungCapChoDuyet],['Tài khoản hoạt động',data.taiKhoanDangHoatDong],['Tài khoản bị khóa',data.taiKhoanBiKhoa]];
 return <><h1>Tổng quan hệ thống</h1><div className="admin-core-grid">{cards.map(([k,v])=><section className="admin-core-card" key={String(k)}><span>{k}</span><b>{v}</b></section>)}</div></>;
}
