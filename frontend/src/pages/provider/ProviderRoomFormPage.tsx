import { BedDouble, ChevronLeft, Image as ImageIcon, Plus, UploadCloud, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { hotelApi } from '../../api/services'
import type { Hotel, RoomRequest } from '../../types'
import { apiError } from '../../utils/format'
import { Loading } from '../../components/UI'

const ROOM_TYPES=['Deluxe','Suite','Standard','Twin','Family']

export default function ProviderRoomFormPage(){
  const navigate=useNavigate()
  const [searchParams]=useSearchParams()
  const requestedHotel=Number(searchParams.get('hotel')||0)
  const [hotels,setHotels]=useState<Hotel[]>([])
  const [selected,setSelected]=useState<number>(requestedHotel)
  const [form,setForm]=useState<RoomRequest>({tenLoaiPhong:'',moTa:'',giaMoiDem:0,tongSoPhong:1,sucChua:1})
  const [roomType,setRoomType]=useState('')
  const [amenities,setAmenities]=useState<string[]>([])
  const [files,setFiles]=useState<File[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{hotelApi.mine().then(list=>{setHotels(list);setSelected(current=>current||list[0]?.id||0)}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[])
  const hotel=hotels.find(item=>item.id===selected)
  const amenityOptions=useMemo(()=>Array.from(new Set((hotel?.tienNghi||'').split(',').map(v=>v.trim()).filter(Boolean))),[hotel?.tienNghi])
  const previews=useMemo(()=>files.map(file=>({file,url:URL.createObjectURL(file)})),[files])
  useEffect(()=>()=>previews.forEach(item=>URL.revokeObjectURL(item.url)),[previews])
  const addFiles=(event:ChangeEvent<HTMLInputElement>)=>{const next=Array.from(event.target.files||[]).filter(file=>file.type.startsWith('image/'));setFiles(current=>[...current,...next].slice(0,5));event.target.value=''}
  const toggle=(item:string)=>setAmenities(list=>list.includes(item)?list.filter(x=>x!==item):[...list,item])
  const submit=async(event:FormEvent)=>{
    event.preventDefault();if(!selected)return
    setBusy(true);setError('')
    try{
      const created=await hotelApi.createRoom(selected,form)
      navigate('/provider/rooms')
    }catch(e){setError(apiError(e))}finally{setBusy(false)}
  }

  if(loading)return <Loading label="Đang tải thông tin khách sạn..."/>
  return <div className="provider-room-form-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><span>Quản lý khách sạn</span><span>›</span><Link to="/provider/rooms">Phòng</Link><span>›</span><strong>Thêm phòng</strong></div>
    <section className="provider-room-form-heading"><h1>Thêm phòng</h1><p>Tạo phòng mới cho khách sạn {hotel?.tenKhachSan||''}.</p></section>
    {error&&<div className="hotel-form-error">{error}</div>}
    <section className="room-form-hotel-banner"><div className="provider-room-hotel-thumb"><span/><i/></div><div><strong>{hotel?.tenKhachSan||'Chọn khách sạn'}</strong><small>{hotel?.diaChi||''}</small></div><select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{hotels.map(item=><option key={item.id} value={item.id}>{item.tenKhachSan}</option>)}</select><button onClick={()=>navigate('/provider/rooms')}><ChevronLeft/> Quay lại danh sách phòng</button></section>

    <form className="provider-room-form-card" onSubmit={submit}>
      <section className="room-form-section"><h2><BedDouble/> 1. Thông tin phòng</h2><div className="room-form-grid">
        <label>Tên phòng <b>*</b><input required value={form.tenLoaiPhong} onChange={e=>setForm(v=>({...v,tenLoaiPhong:e.target.value}))} placeholder="Nhập tên phòng (ví dụ: Phòng Deluxe)"/></label>
        <label>Loại phòng <b>*</b><select required value={roomType} onChange={e=>setRoomType(e.target.value)}><option value="">Chọn loại phòng</option>{ROOM_TYPES.map(item=><option key={item}>{item}</option>)}</select></label>
        <label className="room-form-description">Mô tả <b>*</b><textarea required maxLength={1000} value={form.moTa} onChange={e=>setForm(v=>({...v,moTa:e.target.value}))} placeholder="Nhập mô tả chi tiết về phòng (tiện nghi, diện tích, hướng nhìn...)"/><small>{form.moTa.length}/1000</small></label>
        <label>Giá mỗi đêm (VND) <b>*</b><input required type="number" min={1} value={form.giaMoiDem||''} onChange={e=>setForm(v=>({...v,giaMoiDem:Number(e.target.value)}))} placeholder="Nhập giá"/></label>
        <label>Tổng số phòng <b>*</b><input required type="number" min={1} value={form.tongSoPhong} onChange={e=>setForm(v=>({...v,tongSoPhong:Number(e.target.value)}))}/></label>
        <label>Số khách tối đa <b>*</b><input required type="number" min={1} value={form.sucChua} onChange={e=>setForm(v=>({...v,sucChua:Number(e.target.value)}))}/></label>
      </div></section>
      <section className="room-form-section"><h2><ImageIcon/> 2. Hình ảnh phòng</h2><span className="room-form-caption">Tải lên hình ảnh phòng (tối đa 5 ảnh)</span><div className="room-form-upload-row">
        <label className="room-form-drop"><UploadCloud/><div><strong>Kéo thả ảnh vào đây hoặc nhấp để chọn</strong><small>Hỗ trợ JPG, PNG (tối đa 5MB/ảnh)</small></div><input type="file" accept="image/png,image/jpeg" multiple onChange={addFiles}/></label>
        {previews.map((preview,index)=><div className="room-form-preview" key={`${preview.file.name}-${index}`}><img src={preview.url} alt={preview.file.name}/><button type="button" onClick={()=>setFiles(list=>list.filter((_,i)=>i!==index))}><X/></button></div>)}
        {Array.from({length:Math.max(0,5-previews.length)},(_,i)=><label className="room-form-slot" key={i}><Plus/><input type="file" accept="image/png,image/jpeg" onChange={addFiles}/></label>)}
      </div></section>
      <section className="room-form-section"><h2>⚙ 3. Tiện nghi phòng <small>(tùy chọn)</small></h2><span className="room-form-caption">Chọn từ tiện nghi đã khai báo của khách sạn</span><div className="room-form-amenities">{amenityOptions.map(item=><label key={item}><input type="checkbox" checked={amenities.includes(item)} onChange={()=>toggle(item)}/><span>✓</span>{item}</label>)}</div></section>
      <div className="room-form-actions"><button type="button" className="back" onClick={()=>navigate('/provider/rooms')}><ChevronLeft/> Quay lại</button><button className="save" disabled={busy||!selected}><Plus/>{busy?'Đang thêm...':'Thêm phòng'}</button></div>
    </form>
  </div>
}
