import { useEffect, useState, type FormEvent } from 'react'
import { BedDouble, ChevronLeft, Plus, Save, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { hotelApi, providerRoomApi, type ProviderPhysicalRoomInput, type ProviderRoomType } from '../../api/services'
import { Loading } from '../../components/UI'
import { apiError, money } from '../../utils/format'

export default function ProviderPhysicalRoomFormPage(){
 const navigate=useNavigate(),{id}=useParams(),editing=Boolean(id),viewing=location.pathname.endsWith(`/${id}`)&&editing
 const [types,setTypes]=useState<ProviderRoomType[]>([]),[floors,setFloors]=useState(0),[form,setForm]=useState<ProviderPhysicalRoomInput>({loaiPhongId:0,soPhong:'',tang:1,dangHoatDong:true})
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{Promise.all([providerRoomApi.rooms(),providerRoomApi.types(),hotelApi.mine()]).then(([rooms,ts,hotels])=>{setTypes(ts);setFloors(hotels[0]?.soTang||0);if(editing){const room=rooms.find(x=>x.id===Number(id));if(!room)throw new Error('Không tìm thấy phòng');setForm({loaiPhongId:room.loaiPhongId,soPhong:room.soPhong,tang:room.tang,dangHoatDong:room.dangHoatDong})}else setForm(old=>({...old,loaiPhongId:ts.find(t=>t.dangKinhDoanh)?.id||0}))}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[editing,id])
 const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{if(editing)await providerRoomApi.editRoom(Number(id),form);else await providerRoomApi.addRoom(form);navigate('/provider/rooms')}catch(e){setError(apiError(e))}finally{setBusy(false)}}
 if(loading)return <Loading label="Đang tải dữ liệu phòng..."/>
 const selected=types.find(t=>t.id===form.loaiPhongId),title=viewing?'Chi tiết phòng':editing?'Sửa phòng':'Thêm phòng'
 return <div className="provider-attraction-form-page provider-hotel-reference-form"><div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/rooms">Quản lý phòng</Link><span>›</span><strong>{title}</strong></div>
 <section className="provider-attraction-form-heading"><div><h1>{title}</h1><p>Thiết lập phòng theo bố cục trang Thêm địa điểm.</p></div><button className="attraction-form-close" title="Quay lại" onClick={()=>navigate('/provider/rooms')}><X/></button></section>
 {error&&<div className="hotel-form-error">{error}</div>}
 <form className="attraction-form-card" onSubmit={save}><fieldset className="room-reference-fieldset" disabled={viewing||busy}><div className="attraction-form-main-grid"><section className="attraction-form-left"><h3 className="room-reference-section-heading"><BedDouble/> Thông tin phòng</h3>
 <div className="attraction-form-two"><label>Số phòng <b>*</b><input required maxLength={40} value={form.soPhong} onChange={e=>setForm({...form,soPhong:e.target.value})} placeholder="Ví dụ: 402"/></label><label>Loại phòng <b>*</b><select required value={form.loaiPhongId||''} onChange={e=>setForm({...form,loaiPhongId:Number(e.target.value)})}><option value="">Chọn loại phòng</option>{types.filter(t=>t.dangKinhDoanh||t.id===form.loaiPhongId).map(t=><option key={t.id} value={t.id}>{t.tenLoaiPhong}</option>)}</select></label></div>
 <div className="attraction-form-two"><label>Tầng <b>*</b><select required value={form.tang} onChange={e=>setForm({...form,tang:Number(e.target.value)})}>{Array.from({length:floors},(_,i)=><option key={i+1} value={i+1}>Tầng {i+1}</option>)}</select></label><label>Trạng thái <b>*</b><select value={form.dangHoatDong?'on':'off'} onChange={e=>setForm({...form,dangHoatDong:e.target.value==='on'})}><option value="on">Hoạt động</option><option value="off">Tạm ngừng</option></select></label></div>
 <div className="room-reference-note">Giá mỗi đêm và ảnh được kế thừa từ loại phòng được chọn.</div></section>
 <section className="attraction-map-panel"><div className="attraction-map-panel-title"><h3><BedDouble/> Thông tin loại phòng đã chọn</h3></div>{selected?<div className="room-selected-type">{selected.hinhAnh&&<img src={selected.hinhAnh} alt="Ảnh loại phòng"/>}<strong>{selected.tenLoaiPhong}</strong><p>{selected.moTa}</p><p>Diện tích: {selected.dienTich} m²</p><p>Sức chứa: {selected.soNguoiLon+selected.soTreEm} người</p><p>Giá mỗi đêm: <strong>{money(selected.giaCoBan)}</strong></p></div>:<div className="attraction-map-hint">Chọn loại phòng để xem giá và hình ảnh kế thừa.</div>}</section></div></fieldset>
 <div className="attraction-form-actions"><button type="button" className="cancel" onClick={()=>navigate('/provider/rooms')}><ChevronLeft/> Quay lại danh sách</button><div>{viewing?<button type="button" className="save" onClick={()=>navigate(`/provider/rooms/${id}/edit`)}>Sửa phòng</button>:<button className="save" disabled={busy||!floors||!form.loaiPhongId} type="submit">{editing?<Save/>:<Plus/>}{busy?'Đang lưu...':editing?'Lưu thay đổi':'Thêm phòng'}</button>}</div></div></form></div>
}
