import { useEffect, useMemo, useState } from 'react'
import { Edit3, Eye, Plus, Search, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { providerRoomApi, hotelApi, type ProviderPhysicalRoom, type ProviderRoomType } from '../../api/services'
import { apiError, money } from '../../utils/format'
import { Loading } from '../../components/UI'

export default function ProviderRoomsPage(){
 const navigate=useNavigate()
 const [items,setItems]=useState<ProviderPhysicalRoom[]>([]),[types,setTypes]=useState<ProviderRoomType[]>([]),[floors,setFloors]=useState(0)
 const [q,setQ]=useState(''),[typeFilter,setTypeFilter]=useState(''),[status,setStatus]=useState(''),[floorFilter,setFloorFilter]=useState('')
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[remove,setRemove]=useState<ProviderPhysicalRoom|null>(null),[page,setPage]=useState(1)
 const load=async()=>{setLoading(true);try{const [rs,ts,hs]=await Promise.all([providerRoomApi.rooms(),providerRoomApi.types(),hotelApi.mine()]);setItems(rs);setTypes(ts);setFloors(hs[0]?.soTang||0);setError('')}catch(e){setError(apiError(e))}finally{setLoading(false)}}
 useEffect(()=>{void load()},[])
 const filtered=useMemo(()=>items.filter(x=>(!q||x.soPhong.toLowerCase().includes(q.toLowerCase()))&&(!typeFilter||x.loaiPhongId===Number(typeFilter))&&(!status||(status==='on')===x.dangHoatDong)&&(!floorFilter||x.tang===Number(floorFilter))),[items,q,typeFilter,status,floorFilter])
 const pages=Math.max(1,Math.ceil(filtered.length/5)),name=(id:number)=>types.find(x=>x.id===id)?.tenLoaiPhong||'—'
 const del=async()=>{if(!remove)return;setBusy(true);try{await providerRoomApi.deleteRoom(remove.id);setRemove(null);await load()}catch(e){setError(apiError(e));setRemove(null)}finally{setBusy(false)}}
 return <div className="provider-rooms-v2"><div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Quản lý phòng</strong></div>
 <section className="provider-attraction-list-heading"><div><h1>Danh sách phòng</h1><p>Quản lý từng phòng cụ thể của khách sạn.</p></div><button className="provider-attraction-add" disabled={!floors||!types.some(t=>t.dangKinhDoanh)} onClick={()=>navigate('/provider/rooms/new')}><Plus/> Thêm phòng</button></section>
 {!floors&&<div className="hotel-inline-error">Vui lòng nhập số tầng trong hồ sơ khách sạn trước khi thêm phòng.</div>}{!types.some(t=>t.dangKinhDoanh)&&<div className="hotel-inline-error">Hãy tạo và kích hoạt loại phòng trước khi thêm phòng.</div>}{error&&<div className="hotel-inline-error">{error}</div>}
 <section className="provider-room-table-card"><div className="provider-room-filters physical-room-filter-row"><div className="provider-room-search"><Search className="room-filter-search-icon"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Tìm kiếm số phòng..."/></div>
 <label><span>Loại phòng</span><select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1)}}><option value="">Tất cả</option>{types.map(x=><option key={x.id} value={x.id}>{x.tenLoaiPhong}</option>)}</select></label>
 <label><span>Trạng thái</span><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tất cả</option><option value="on">Hoạt động</option><option value="off">Tạm ngừng</option></select></label>
 <label><span>Tầng</span><select value={floorFilter} onChange={e=>{setFloorFilter(e.target.value);setPage(1)}}><option value="">Tất cả tầng</option>{Array.from({length:floors},(_,i)=><option key={i+1} value={i+1}>Tầng {i+1}</option>)}</select></label></div>
 {loading?<Loading label="Đang tải danh sách phòng..."/>:<div className="provider-room-table-wrap"><table className="provider-room-table"><thead><tr><th>STT</th><th>Số phòng</th><th>Tầng</th><th>Loại phòng</th><th>Giá mỗi đêm</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.slice((page-1)*5,page*5).map((x,i)=><tr key={x.id}><td>{(page-1)*5+i+1}</td><td>{x.soPhong}</td><td>{x.tang}</td><td>{name(x.loaiPhongId)}</td><td>{money(x.giaMoiDem)}</td><td>{x.dangHoatDong?'Hoạt động':'Tạm ngừng'}</td><td><div className="provider-attraction-actions"><button title="Xem" aria-label="Xem phòng" onClick={()=>navigate(`/provider/rooms/${x.id}`)}><Eye/></button><button title="Sửa" aria-label="Sửa phòng" onClick={()=>navigate(`/provider/rooms/${x.id}/edit`)}><Edit3/></button><button title="Xóa" aria-label="Xóa phòng" className="delete" onClick={()=>setRemove(x)}><Trash2/></button></div></td></tr>)}</tbody></table></div>}
 <div className="provider-hotel-pagination"><span>{filtered.length} phòng</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button><span>{Math.min(page,pages)}/{pages}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)}>›</button></div></div></section>
 {remove&&<div className="attraction-modal-backdrop" onMouseDown={()=>!busy&&setRemove(null)}><div className="attraction-delete-modal" onMouseDown={e=>e.stopPropagation()}><button className="attraction-delete-close" onClick={()=>setRemove(null)}><X/></button><span className="attraction-delete-icon"><Trash2/></span><h3>Xóa phòng?</h3><p>Bạn có chắc muốn xóa phòng <strong>{remove.soPhong}</strong>?</p><div className="attraction-delete-warning"><span>!</span><div><strong>Hành động này không thể hoàn tác.</strong><small>Phòng có đặt chỗ liên quan có thể không được phép xóa.</small></div></div><div className="attraction-delete-actions"><button onClick={()=>setRemove(null)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void del()}><Trash2/>{busy?'Đang xóa...':'Xóa phòng'}</button></div></div></div>}
 </div>
}
