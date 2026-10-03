import { useEffect, useMemo, useState } from 'react'
import { Edit3, Eye, Plus, Search, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { providerRoomApi, type ProviderRoomType } from '../../api/services'
import { apiError, money } from '../../utils/format'
import { Loading } from '../../components/UI'

export default function ProviderRoomTypesPage() {
  const navigate = useNavigate()
  const [items,setItems] = useState<ProviderRoomType[]>([])
  const [q,setQ] = useState(''), [status,setStatus] = useState(''), [priceFilter,setPriceFilter] = useState('')
  const [loading,setLoading] = useState(true), [error,setError] = useState(''), [busy,setBusy] = useState(false)
  const [remove,setRemove] = useState<ProviderRoomType|null>(null), [page,setPage] = useState(1)
  const load = async () => { setLoading(true); try { setItems(await providerRoomApi.types()); setError('') } catch(e) { setError(apiError(e)) } finally { setLoading(false) } }
  useEffect(()=>{void load()},[])
  const filtered = useMemo(()=>items.filter(x=>(!q || x.tenLoaiPhong.toLowerCase().includes(q.toLowerCase())) && (!status || (status==='on')===x.dangKinhDoanh) && (!priceFilter || (priceFilter==='low' ? x.giaCoBan<500000 : priceFilter==='mid' ? x.giaCoBan>=500000 && x.giaCoBan<1500000 : x.giaCoBan>=1500000))),[items,q,status,priceFilter])
  const pages=Math.max(1,Math.ceil(filtered.length/5))
  const del=async()=>{if(!remove)return;setBusy(true);try{await providerRoomApi.deleteType(remove.id);setRemove(null);await load()}catch(e){setError(apiError(e));setRemove(null)}finally{setBusy(false)}}
  return <div className="provider-rooms-v2">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><strong>Quản lý loại phòng</strong></div>
    <section className="provider-attraction-list-heading"><div><h1>Danh sách loại phòng</h1><p>Quản lý loại phòng của khách sạn.</p></div><button className="provider-attraction-add" onClick={()=>navigate('/provider/room-types/new')}><Plus/> Thêm loại phòng</button></section>
    {error&&<div className="hotel-inline-error">{error}</div>}
    <section className="provider-room-table-card"><div className="provider-room-filters room-type-filter-row">
      <div className="provider-room-search"><Search className="room-filter-search-icon"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Tìm kiếm loại phòng..."/></div>
      <label><span>Trạng thái</span><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tất cả</option><option value="on">Đang kinh doanh</option><option value="off">Tạm ngừng</option></select></label>
      <label><span>Khoảng giá/đêm</span><select value={priceFilter} onChange={e=>{setPriceFilter(e.target.value);setPage(1)}}><option value="">Tất cả mức giá</option><option value="low">Dưới 500.000đ</option><option value="mid">500.000đ – dưới 1.500.000đ</option><option value="high">Từ 1.500.000đ</option></select></label>
    </div>{loading?<Loading label="Đang tải loại phòng..."/>:<div className="provider-room-table-wrap"><table className="provider-room-table"><thead><tr><th>STT</th><th>Tên loại phòng</th><th>Sức chứa</th><th>Giá/đêm</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.slice((page-1)*5,page*5).map((x,i)=><tr key={x.id}><td>{(page-1)*5+i+1}</td><td>{x.tenLoaiPhong}</td><td>{x.soNguoiLon+x.soTreEm} người</td><td>{money(x.giaCoBan)}</td><td>{x.dangKinhDoanh?'Đang kinh doanh':'Tạm ngừng'}</td><td><div className="provider-attraction-actions"><button title="Xem" aria-label="Xem loại phòng" onClick={()=>navigate(`/provider/room-types/${x.id}`)}><Eye/></button><button title="Sửa" aria-label="Sửa loại phòng" onClick={()=>navigate(`/provider/room-types/${x.id}/edit`)}><Edit3/></button><button title="Xóa" aria-label="Xóa loại phòng" className="delete" onClick={()=>setRemove(x)}><Trash2/></button></div></td></tr>)}</tbody></table></div>}
      <div className="provider-hotel-pagination"><span>{filtered.length} loại phòng</span><div><button disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button><span>{Math.min(page,pages)}/{pages}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)}>›</button></div></div>
    </section>
    {remove&&<div className="attraction-modal-backdrop" onMouseDown={()=>!busy&&setRemove(null)}><div className="attraction-delete-modal" onMouseDown={e=>e.stopPropagation()}><button className="attraction-delete-close" onClick={()=>setRemove(null)}><X/></button><span className="attraction-delete-icon"><Trash2/></span><h3>Xóa loại phòng?</h3><p>Bạn có chắc muốn xóa <strong>{remove.tenLoaiPhong}</strong>?</p><div className="attraction-delete-warning"><span>!</span><div><strong>Hành động này không thể hoàn tác.</strong><small>Không thể xóa nếu loại phòng còn liên kết với phòng.</small></div></div><div className="attraction-delete-actions"><button onClick={()=>setRemove(null)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void del()}><Trash2/>{busy?'Đang xóa...':'Xóa loại phòng'}</button></div></div></div>}
  </div>
}
