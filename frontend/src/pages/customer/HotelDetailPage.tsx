import { GoogleMapFrame } from '../../components/GoogleMap'
import {
  Bath,
  BedDouble,
  Check,
  ChevronRight,
  Dumbbell,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  UtensilsCrossed,
  Waves,
  Wifi,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { hotelApi, promotionApi } from '../../api/services'
import type { PromotionApiResponse } from '../../data/promotions'
import type { Hotel, Room } from '../../types'
import { apiError, money } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'
import { googleMapEmbed } from '../../utils/googleMaps'

function displayCity(value:string){return value==='Da Nang'?'Đà Nẵng':value}
function promoForRoom(room:Room,promos:PromotionApiResponse[]){return promos.find(p=>!p.serviceIds?.length||p.serviceIds.includes(room.id))}
function promoText(p?:PromotionApiResponse){if(!p)return '';return p.discountType==='PERCENTAGE'?`Giảm ${Number(p.discountValue)}%`:`Giảm ${money(Number(p.discountValue))}`}
function nights(a:string,b:string){const x=new Date(a).getTime(),y=new Date(b).getTime();return x&&y?Math.max(1,Math.ceil((y-x)/86400000)):1}

export default function HotelDetailPage(){
  const {id}=useParams();const [sp]=useSearchParams();const navigate=useNavigate()
  const [h,setH]=useState<Hotel|null>(null);const [roomPhotos,setRoomPhotos]=useState<Record<number,string>>({});const [promos,setPromos]=useState<PromotionApiResponse[]>([])
  const [galleryOpen,setGalleryOpen]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [tab,setTab]=useState<'rooms'|'location'|'reviews'>('rooms')
  const checkIn=sp.get('checkIn')||'';const checkOut=sp.get('checkOut')||'';const guests=Math.max(1,Number(sp.get('guests')||2));const stay=nights(checkIn,checkOut)
  useEffect(()=>{setLoading(true);hotelApi.detail(Number(id),checkIn,checkOut,guests).then(async hotel=>{setH(hotel);hotelApi.physicalInventory(Number(id)).then(rooms=>{const photos:Record<number,string>={};rooms.forEach(r=>{if(r.hinhAnh&&!photos[r.loaiPhongId])photos[r.loaiPhongId]=r.hinhAnh});setRoomPhotos(photos)}).catch(()=>setRoomPhotos({}));setPromos(await promotionApi.available({serviceType:'HOTEL',providerId:hotel.nhaCungCapId}).catch(()=>[]))}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[id,checkIn,checkOut,guests])
  const available=useMemo(()=>h?.danhSachPhong?.filter(r=>r.trangThai==='AVAILABLE'&&r.soPhongConLai>0&&r.sucChua>=guests)||[],[h,guests])
  const min=available.length?Math.min(...available.map(r=>Number(r.giaMoiDem))):0
  if(loading)return <div className="container pad"><Loading label="Đang tải khách sạn..."/></div>
  if(error||!h)return <div className="container pad"><ErrorState message={error||'Không tìm thấy khách sạn.'}/></div>
  const hotelPromo=promos.find(p=>p.providerId==null||p.providerId===h.nhaCungCapId)
  const hotelImages=[h.hinhAnh,h.anhGioiThieu,...(h.anhThuVien||'').split(',')]
    .map(value=>(value||'').trim()).filter((value,index,all)=>Boolean(value)&&all.indexOf(value)===index)
  return <div className="customer-page hotel-detail-v2">
    <div className="container hotel-detail-wrap-v2">
      <div className="travel-breadcrumb-v2">Trang chủ <span>›</span> Khách sạn <span>›</span> {displayCity(h.thanhPho)} <span>›</span> {h.tenKhachSan}</div>
      <div className="hotel-detail-heading-v2"><div><h1>{h.tenKhachSan} <span>{'★'.repeat(h.soSao||0)}</span></h1><p><MapPin/>{h.diaChi}, {displayCity(h.thanhPho)}</p></div></div>
      <div className="hotel-detail-top-v2">
        <div className="hotel-gallery-v3">{hotelImages.length>0? <>
 <button type="button" className="hotel-gallery-main-v3" style={{backgroundImage:`url("${hotelImages[0]}")`}} onClick={()=>setGalleryOpen(true)} aria-label="Xem ảnh khách sạn">{hotelPromo&&<span>{promoText(hotelPromo)}</span>}</button>
 {hotelImages.length>1&&<div className="hotel-gallery-thumbs-v3">{hotelImages.slice(0,5).map((src,i)=><button type="button" key={src} className={`hotel-gallery-thumb-v3 ${i===0?'active':''}`} style={{backgroundImage:`url("${src}")`}} onClick={()=>setGalleryOpen(true)} aria-label={`Xem ảnh khách sạn ${i+1}`}>{i===4&&hotelImages.length>5?<b>+{hotelImages.length-5} ảnh</b>:null}</button>)}</div>}
 <button type="button" className="hotel-gallery-all-v3" onClick={()=>setGalleryOpen(true)}>Xem tất cả {hotelImages.length} ảnh</button>
 </>:<div className="hotel-gallery-empty-v3">Khách sạn chưa cập nhật hình ảnh.</div>}</div>
 {galleryOpen&&<div className="hotel-gallery-modal" role="dialog" aria-modal="true" aria-label="Tất cả ảnh khách sạn" onClick={()=>setGalleryOpen(false)}><div className="hotel-gallery-modal-inner" onClick={e=>e.stopPropagation()}><button className="hotel-gallery-close" onClick={()=>setGalleryOpen(false)}>Đóng ×</button><h2>Thư viện ảnh · {h.tenKhachSan}</h2><div className="hotel-gallery-modal-grid">{hotelImages.map((src,i)=><img src={src} alt={`Ảnh khách sạn ${i+1}`} key={src} onError={e=>e.currentTarget.remove()}/>)}</div></div></div>}
        <aside className="hotel-book-box-v2 hotel-info-box-v2">
          <h2>Thông tin khách sạn</h2>
          <h3>{h.tenKhachSan}</h3>
          <p className="hotel-info-rating-v2">{h.soSao} sao <span>{'★'.repeat(h.soSao||0)}</span></p>
          <p><MapPin size={16}/>{h.diaChi}, {displayCity(h.thanhPho)}</p>
          <p>{available.length} loại phòng khả dụng</p>
          <p>Giá phòng từ <strong>{min?money(min):'Chưa có phòng'}</strong> / đêm</p>
          <button onClick={()=>navigate(`/hotels/${h.id}/rooms-map?${sp.toString()}`)}>Chọn phòng →</button>
        </aside>
      </div>
      <div className="travel-tabs-v2"><button className={tab==='rooms'?'active':''} onClick={()=>setTab('rooms')}>Các loại phòng</button><button className={tab==='location'?'active':''} onClick={()=>setTab('location')}>Vị trí</button><button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}>Đánh giá khách hàng</button></div>
      <div className="hotel-detail-content-v2">
        <main>
          
          {tab==='rooms'&&<section className="hotel-room-section-v2" id="hotel-room-list"><div className="travel-section-head-v2"><h2>{tab==='rooms'?'Chọn phòng phù hợp với nhu cầu của bạn':'Các loại phòng'}</h2><span>{available.length} loại phòng khả dụng</span></div>{available.length?available.map((r,i)=>{const promo=promoForRoom(r,promos);return <article className="hotel-room-card-v2" key={r.id}><div className="hotel-room-image-v2" style={roomPhotos[r.id]?{backgroundImage:`url("${roomPhotos[r.id]}")`}:undefined}>{promo&&<span>{promoText(promo)}</span>}</div><div className="hotel-room-info-v2"><h3>{r.tenLoaiPhong}</h3><div className="hotel-room-meta-v2"><span><UsersRound/>{r.sucChua} khách</span><span><BedDouble/>Còn {r.soPhongConLai} phòng</span></div><p>{r.moTa||'Thông tin phòng do nhà cung cấp quản lý trên hệ thống.'}</p><div className="hotel-room-perks-v2"><span><Check/>Xác nhận tức thì</span><span><ShieldCheck/>Giá được hệ thống xác nhận</span></div>{promo&&<div className="hotel-room-promo-v2"><Sparkles/>Mã <b>{promo.code}</b> của {promo.providerName}</div>}</div><div className="hotel-room-price-v2"><strong>{money(Number(r.giaMoiDem))}</strong><span>/ đêm</span><small>{stay} đêm · giá Booking Service xác nhận</small><Link to={`/hotels/${h.id}/room-types/${r.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}>Xem chi tiết</Link></div></article>}):<div className="travel-card-v2">Hiện không có phòng phù hợp với tiêu chí tìm kiếm.</div>}</section>}
          {tab==='reviews'&&<section className="travel-card-v2"><h2>Đánh giá khách hàng</h2><p>Hiện chưa có đánh giá khách sạn.</p></section>}
          {tab==='location'&&<section className="travel-card-v2"><h2>Vị trí khách sạn</h2><div className="travel-map-frame-v2"><GoogleMapFrame title="Vị trí khách sạn" loading="lazy" src={googleMapEmbed(h.viDo,h.kinhDo,`${h.diaChi}, ${h.thanhPho}`)}/></div><p><MapPin/>{h.diaChi}, {displayCity(h.thanhPho)}</p></section>}
        </main>
        <aside className="hotel-detail-side-v2">
          {tab==='rooms'&&<section className="travel-card-v2"><h3>Vị trí và đánh giá khách sạn</h3><div className="hotel-location-rating-v2"><strong>{h.soSao} sao</strong><span>{'★'.repeat(h.soSao||0)}</span><p>Hiện chưa có đánh giá khách sạn.</p></div><div className="hotel-mini-map-v2"><MapPin/><b>{displayCity(h.thanhPho)}</b></div><button onClick={()=>setTab('location')}>Xem bản đồ <ChevronRight/></button></section>}
          {tab==='location'&&<section className="travel-card-v2"><h3>Địa chỉ khách sạn</h3><p>{h.diaChi}, {displayCity(h.thanhPho)}</p></section>}
          {tab==='reviews'&&<section className="travel-card-v2"><h3>Thông tin đánh giá</h3><p>{h.soSao} sao (hạng khách sạn)</p></section>}
        </aside>
      </div>
    </div>
  </div>
}
