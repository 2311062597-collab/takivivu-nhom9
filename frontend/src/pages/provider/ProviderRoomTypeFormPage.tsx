import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { BedDouble, ChevronLeft, Image as ImageIcon, Plus, Save, UploadCloud, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { hotelApi, providerRoomApi, type ProviderRoomTypeInput } from '../../api/services'
import { Loading } from '../../components/UI'
import { apiError } from '../../utils/format'

const blank: ProviderRoomTypeInput={tenLoaiPhong:'',moTa:'',dienTich:1,soNguoiLon:1,soTreEm:0,loaiGiuong:'',soLuongGiuong:1,tienNghi:'',giaCoBan:1,hinhAnh:'',anhThuVien:'',dangKinhDoanh:true}
export default function ProviderRoomTypeFormPage(){
 const navigate=useNavigate(),{id}=useParams(),editing=Boolean(id),viewing=location.pathname.endsWith(`/${id}`)&&editing
 const [form,setForm]=useState<ProviderRoomTypeInput>({...blank}),[loading,setLoading]=useState(editing),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [hotelAmenities,setHotelAmenities]=useState<string[]>([])
 useEffect(()=>{hotelApi.mine().then(items=>{const source=(items[0]?.tienNghi||'').split(',').map(v=>v.trim()).filter(Boolean);setHotelAmenities(Array.from(new Set(source))) }).catch(()=>setHotelAmenities([]))},[])
 useEffect(()=>{if(!editing)return;providerRoomApi.types().then(items=>{const item=items.find(x=>x.id===Number(id));if(!item)throw new Error('Không tìm thấy loại phòng');setForm({tenLoaiPhong:item.tenLoaiPhong,moTa:item.moTa,dienTich:item.dienTich,soNguoiLon:item.soNguoiLon,soTreEm:item.soTreEm,loaiGiuong:item.loaiGiuong,soLuongGiuong:item.soLuongGiuong,tienNghi:item.tienNghi||'',giaCoBan:item.giaCoBan,hinhAnh:item.hinhAnh,anhThuVien:item.anhThuVien||'',dangKinhDoanh:item.dangKinhDoanh})}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[editing,id])
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('image/')||file.size>5*1024*1024){setError('Chỉ chọn ảnh tối đa 5MB.');return}setBusy(true);setError('');try{const result=await hotelApi.uploadImage(file);setForm(old=>({...old,hinhAnh:result.url}))}catch(e){setError(apiError(e))}finally{setBusy(false)}}
 const uploadGallery=async(e:ChangeEvent<HTMLInputElement>)=>{
   const selected=Array.from(e.target.files||[]);e.target.value='';
   if(selected.some(file=>!file.type.startsWith('image/')||file.size>5*1024*1024)){
     setError('Chỉ chọn ảnh JPG, PNG, WEBP tối đa 5MB mỗi ảnh.');return;
   }
   if((form.anhThuVien||'').split(',').filter(Boolean).length+selected.length>12){setError('Tối đa 12 ảnh thư viện.');return}
   setBusy(true);setError('');try{
     const urls=await Promise.all(selected.map(f=>hotelApi.uploadImage(f).then(result=>result.url)));
     setForm(old=>({...old,anhThuVien:[...(old.anhThuVien||'').split(',').filter(Boolean),...urls].join(',')}));
   }catch(error){setError(apiError(error))}finally{setBusy(false)}
 }
 const selectedAmenities=(form.tienNghi||'').split(',').map(v=>v.trim()).filter(Boolean)
 const amenityOptions=Array.from(new Set([...hotelAmenities,...selectedAmenities]))
 const toggleAmenity=(item:string)=>{const next=selectedAmenities.includes(item)?selectedAmenities.filter(v=>v!==item):[...selectedAmenities,item];setForm({...form,tienNghi:next.join(', ')})}
 const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{const payload={...form,tienNghi:(form.tienNghi||'').trim()};if(editing)await providerRoomApi.editType(Number(id),payload);else await providerRoomApi.addType(payload);navigate('/provider/room-types')}catch(e){setError(apiError(e))}finally{setBusy(false)}}
 if(loading)return <Loading label="Đang tải loại phòng..."/>
 const title=viewing?'Chi tiết loại phòng':editing?'Sửa loại phòng':'Thêm loại phòng'
 return <div className="provider-attraction-form-page provider-hotel-reference-form"><div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/room-types">Quản lý loại phòng</Link><span>›</span><strong>{title}</strong></div>
 <section className="provider-attraction-form-heading"><div><h1>{title}</h1><p>Thông tin và hình ảnh loại phòng theo mẫu thêm địa điểm.</p></div><button className="attraction-form-close" title="Quay lại" onClick={()=>navigate('/provider/room-types')}><X/></button></section>
 {error&&<div className="hotel-form-error">{error}</div>}
 <form className="attraction-form-card" onSubmit={save}><fieldset disabled={viewing||busy} className="room-reference-fieldset"><div className="attraction-form-main-grid"><section className="attraction-form-left"><h3 className="room-reference-section-heading"><BedDouble/> Thông tin loại phòng</h3>
 <div className="attraction-form-two"><label>Tên loại phòng <b>*</b><input required maxLength={100} value={form.tenLoaiPhong} onChange={e=>setForm({...form,tenLoaiPhong:e.target.value})} placeholder="Ví dụ: Deluxe, VIP..."/></label><label>Trạng thái <b>*</b><select value={form.dangKinhDoanh?'on':'off'} onChange={e=>setForm({...form,dangKinhDoanh:e.target.value==='on'})}><option value="on">Đang kinh doanh</option><option value="off">Tạm ngừng</option></select></label></div>
 <label>Mô tả <b>*</b><textarea required maxLength={1000} value={form.moTa} onChange={e=>setForm({...form,moTa:e.target.value})} placeholder="Mô tả loại phòng..."/><small>{form.moTa.length}/1000</small></label>
 <div className="attraction-form-two"><label>Diện tích (m²) <b>*</b><input required type="number" min="0.01" step="any" value={form.dienTich} onChange={e=>setForm({...form,dienTich:Number(e.target.value)})}/></label><label>Số người ở <b>*</b><input required type="number" min="1" step="1" value={form.soNguoiLon} onChange={e=>setForm({...form,soNguoiLon:Number(e.target.value),soTreEm:0})}/></label></div>
 <div className="attraction-form-two"><label>Loại giường <b>*</b><input required value={form.loaiGiuong} onChange={e=>setForm({...form,loaiGiuong:e.target.value})} placeholder="Ví dụ: Giường đôi"/></label><label>Số giường <b>*</b><input required type="number" min="1" step="1" value={form.soLuongGiuong} onChange={e=>setForm({...form,soLuongGiuong:Number(e.target.value)})}/></label></div>
 <label>Giá mỗi đêm (VNĐ) <b>*</b><input required min="0.01" type="number" step="any" value={form.giaCoBan} onChange={e=>setForm({...form,giaCoBan:Number(e.target.value)})}/></label>
 <div className="room-type-amenity-source"><strong>Tiện nghi của loại phòng</strong><small>Chọn từ danh sách tiện nghi đã khai báo trong hồ sơ khách sạn.</small>{amenityOptions.length>0?<div className="room-form-amenities">{amenityOptions.map(item=><label key={item}><input type="checkbox" checked={selectedAmenities.includes(item)} onChange={()=>toggleAmenity(item)}/><span>✓</span>{item}</label>)}</div>:<div className="room-reference-note">Khách sạn chưa khai báo tiện nghi. Hãy cập nhật Tiện nghi khách sạn trước.</div>}</div></section>
 <section className="attraction-map-panel"><div className="attraction-map-panel-title"><h3><ImageIcon/> Hình ảnh loại phòng</h3></div><p className="room-reference-muted">Thêm ảnh đại diện theo cùng kiểu chọn ảnh của trang Thêm địa điểm.</p>
 <div className="attraction-image-row room-type-image-row">{form.hinhAnh&&<div className="attraction-image-preview"><img src={form.hinhAnh} alt="Ảnh loại phòng"/>{!viewing&&<button type="button" title="Xóa ảnh" onClick={()=>setForm({...form,hinhAnh:''})}><X/></button>}</div>}{!viewing&&<label className="attraction-image-drop"><UploadCloud/><div><strong>{form.hinhAnh?'Thay ảnh':'Kéo thả ảnh vào đây hoặc nhấp để chọn'}</strong><small>JPG, PNG, WEBP (tối đa 5MB/ảnh)</small></div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>}</div>
 {!viewing&&!form.hinhAnh&&<label className="room-image-url-label">Hoặc nhập đường dẫn ảnh<input value={form.hinhAnh} onChange={e=>setForm({...form,hinhAnh:e.target.value})} placeholder="Đường dẫn hình ảnh"/></label>}
 <div className="attraction-map-hint">Ảnh đại diện và thư viện ảnh được lưu riêng.</div>
 <h4>Thêm nhiều ảnh phòng (tối đa 12 ảnh)</h4>
 <div className="attraction-image-row room-type-image-row">
 {(form.anhThuVien||'').split(',').filter(Boolean).map((src,index)=><div key={`${src}-${index}`} className="attraction-image-preview">
  <img src={src} alt={`Ảnh bổ sung ${index+1}`} onError={e=>{e.currentTarget.style.display='none'}} />
  {!viewing&&<button type="button" title="Xóa ảnh này" onClick={()=>setForm(old=>({...old,anhThuVien:(old.anhThuVien||'').split(',').filter(Boolean).filter((_,i)=>i!==index).join(',')}))}><X/></button>}
 </div>)}
 {!viewing&&<label className="attraction-image-drop"><UploadCloud/><div><strong>Thêm ảnh phòng</strong><small>Có thể chọn nhiều ảnh cùng lúc (tối đa 12)</small></div><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadGallery}/></label>}
 </div></section></div></fieldset>
 <div className="attraction-form-actions"><button type="button" className="cancel" onClick={()=>navigate('/provider/room-types')}><ChevronLeft/> Quay lại danh sách</button><div>{viewing?<button type="button" className="save" onClick={()=>navigate(`/provider/room-types/${id}/edit`)}>Sửa loại phòng</button>:<button className="save" disabled={busy||!form.hinhAnh} type="submit">{editing?<Save/>:<Plus/>}{busy?'Đang lưu...':editing?'Lưu thay đổi':'Thêm loại phòng'}</button>}</div></div></form></div>
}
