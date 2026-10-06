import { GoogleMapFrame } from '../../components/GoogleMap'
import {
  Check,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { attractionApi, promotionApi } from '../../api/services'
import type { PromotionApiResponse } from '../../data/promotions'
import type { Attraction, TicketType } from '../../types'
import { apiError, money } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'
import { googleMapEmbed, googleMapDirections } from '../../utils/googleMaps'

function displayCity(v:string){return v==='Da Nang'?'Đà Nẵng':v}
function promoForTicket(t:TicketType,promos:PromotionApiResponse[],qty=1){const total=Number(t.giaVe||0)*Math.max(1,qty);return promos.find(p=>(!p.serviceIds?.length||p.serviceIds.includes(t.id))&&Number(p.minOrderAmount||0)<=total)}
function promoText(p?:PromotionApiResponse){if(!p)return '';return p.discountType==='PERCENTAGE'?`Giảm ${Number(p.discountValue)}%`:`Giảm ${money(Number(p.discountValue))}`}

export default function AttractionDetailPage(){
  const {id}=useParams();const [sp]=useSearchParams();const [a,setA]=useState<Attraction|null>(null);const [promos,setPromos]=useState<PromotionApiResponse[]>([])
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [tab,setTab]=useState<'tickets'|'info'|'images'|'reviews'|'directions'>('tickets')
  const date=sp.get('date')||'';const initialQty=Math.max(1,Number(sp.get('qty')||1));const [quantities,setQuantities]=useState<Record<number,number>>({})
  useEffect(()=>{setLoading(true);attractionApi.detail(Number(id)).then(async item=>{setA(item);setPromos(await promotionApi.available({serviceType:'ATTRACTION',providerId:item.nhaCungCapId}).catch(()=>[]))}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[id])
  const available=useMemo(()=>a?.danhSachLoaiVe?.filter(v=>v.trangThai==='AVAILABLE'&&v.soVeConLai>0)||[],[a])
  useEffect(()=>{if(available.length&&!Object.keys(quantities).length)setQuantities({[available[0].id]:initialQty})},[available.length])
  if(loading)return <div className="container pad"><Loading label="Đang tải địa điểm..."/></div>
  if(error||!a)return <div className="container pad"><ErrorState message={error||'Không tìm thấy địa điểm.'}/></div>
  const min=available.length?Math.min(...available.map(v=>Number(v.giaVe))):0
  const attractionPromo=promos.find(p=>(p.providerId==null||p.providerId===a.nhaCungCapId)&&Number(p.minOrderAmount||0)<=min)
  const total=available.reduce((sum,t)=>sum+Number(t.giaVe)*(quantities[t.id]||0),0)
  const selected=available.find(t=>(quantities[t.id]||0)>0)
  const effectiveDate=selected ? ((!date || (selected.ngayBatDau&&date<selected.ngayBatDau) || (selected.ngayKetThuc&&date>selected.ngayKetThuc)) ? (selected.ngayBatDau||date) : date) : date
  const setQty=(ticketId:number,next:number,max:number)=>setQuantities(current=>({...current,[ticketId]:Math.max(0,Math.min(max,next))}))
  const fullAddress=[a.diaChi,a.quanHuyen,displayCity(a.thanhPho)].filter(Boolean).join(', ')
  const mapUrl=googleMapEmbed(a.viDo,a.kinhDo,fullAddress)
  return <div className="customer-page attraction-detail-v2"><div className="container attraction-detail-wrap-v2">
    <div className="travel-breadcrumb-v2">Trang chủ <span>›</span> Địa điểm tham quan <span>›</span> {a.tenDiaDiem}</div>
    <div className="attraction-detail-head-v2"><div className="attraction-detail-main-image-v2">{a.hinhAnh?<img src={a.hinhAnh} onError={e=>e.currentTarget.remove()} alt={a.tenDiaDiem}/>:<p>Chưa có ảnh địa điểm</p>}</div><div className="attraction-detail-info-v2">{a.trangThai==='ACTIVE'&&<span className="attraction-open-v2">Đang mở</span>}<h1>{a.tenDiaDiem}</h1><p>{a.moTa||'Nhà cung cấp chưa cập nhật mô tả.'}</p><div className="attraction-facts-v2"><span><MapPin/>{fullAddress}</span><span><Clock3>{/* icon */}</Clock3>{a.gioMoCua} - {a.gioDongCua}</span><span><Ticket/>Vé điện tử từ nhà cung cấp</span><span><UsersRound/>Phù hợp cá nhân, cặp đôi, nhóm bạn</span></div>{attractionPromo&&<div className="attraction-detail-promo-v2"><Sparkles/><span><b>{promoText(attractionPromo)}</b>Mã {attractionPromo.code} · {attractionPromo.providerName}</span></div>}</div></div>
    <div className="travel-tabs-v2 attraction-tabs-v2"><button className={tab==='tickets'?'active':''} onClick={()=>setTab('tickets')}>Vé tham quan</button><button className={tab==='info'?'active':''} onClick={()=>setTab('info')}>Thông tin chi tiết</button><button className={tab==='images'?'active':''} onClick={()=>setTab('images')}>Hình ảnh</button><button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}>Đánh giá</button><button className={tab==='directions'?'active':''} onClick={()=>setTab('directions')}>Hướng dẫn di chuyển</button></div>

    {tab==='tickets'&&<div className="attraction-book-layout-v2" id="attraction-book"><main><section className="travel-card-v2"><div className="travel-section-head-v2"><h2>Chọn loại vé</h2><span>{available.length} loại vé đang bán</span></div>{available.map(t=>{const q=quantities[t.id]||0;const promo=promoForTicket(t,promos,q||1);return <div className={`ticket-select-row-v2 ${q>0?'selected':''}`} key={t.id}><input type="checkbox" checked={q>0} onChange={()=>setQty(t.id,q>0?0:1,t.soVeConLai)}/><div className="ticket-select-info-v2"><h3>{t.tenLoaiVe}</h3><p>{t.doiTuongApDung || t.moTa || 'Vé tham quan do nhà cung cấp cấu hình.'}</p><div><span><Check/>Vé điện tử</span><span><Check/>Còn {t.soVeConLai} vé</span><span><Check/>Hiệu lực {t.ngayBatDau} - {t.ngayKetThuc}</span></div>{promo&&<em>{promoText(promo)} · mã {promo.code}</em>}</div><strong>{money(Number(t.giaVe))}<small>/người</small></strong><div className="ticket-qty-v2"><button onClick={()=>setQty(t.id,q-1,t.soVeConLai)}><Minus/></button><b>{q}</b><button onClick={()=>setQty(t.id,q+1,t.soVeConLai)}><Plus/></button></div></div>})}</section></main><aside><section className="travel-card-v2 attraction-order-summary-v2"><h3>Thông tin đặt vé</h3><div className="attraction-order-place-v2">{a.hinhAnh&&<img src={a.hinhAnh} onError={e=>e.currentTarget.remove()} alt={a.tenDiaDiem}/>}<div><b>{a.tenDiaDiem}</b><span><MapPin/>{displayCity(a.thanhPho)}</span></div></div><p><span>Ngày tham quan</span><b>{effectiveDate||'Chưa chọn'}</b></p><p><span>Số lượng</span><b>{Object.values(quantities).reduce((s,v)=>s+v,0)} vé</b></p><p className="total"><span>Tạm tính</span><b>{money(total)}</b></p><small>Giá và ưu đãi sẽ được kiểm tra lại trước khi xác nhận đặt vé.</small>{selected&&<Link to={`/booking/new?type=ATTRACTION&id=${selected.id}&qty=${Math.max(1,quantities[selected.id]||1)}&start=${effectiveDate}&tickets=${encodeURIComponent(JSON.stringify(Object.entries(quantities).filter(([,q])=>q>0).map(([ticketId,quantity])=>({id:Number(ticketId),qty:quantity}))))}`}>Tiếp tục →</Link>}</section></aside></div>}

    {tab==='info'&&<div className="attraction-info-grid-v2"><section className="travel-card-v2"><h2>Thông tin chi tiết</h2><p>{a.moTa||'Nhà cung cấp chưa cập nhật mô tả.'}</p><dl><div><dt>Tên địa điểm</dt><dd>{a.tenDiaDiem}</dd></div><div><dt>Địa chỉ cụ thể</dt><dd>{a.diaChi}</dd></div><div><dt>Quận/huyện</dt><dd>{a.quanHuyen || '—'}</dd></div><div><dt>Thành phố</dt><dd>{displayCity(a.thanhPho)}</dd></div><div><dt>Giờ hoạt động</dt><dd>{a.gioMoCua} - {a.gioDongCua}</dd></div><div><dt>Trạng thái</dt><dd>{a.trangThai==='ACTIVE'?'Đang hoạt động':'Tạm ngưng'}</dd></div></dl></section><section className="travel-card-v2 policy-v2"><h3>Cam kết TAKIVIVU</h3><p><Check/>Số lượng vé được kiểm tra trước khi đặt</p><p><Check/>Ưu đãi hợp lệ được áp dụng tự động</p><p><Check/>Thanh toán được xác nhận an toàn</p></section></div>}

    {tab==='images'&&<section className="travel-card-v2"><h2>Hình ảnh</h2>
      {a.hinhAnh?<div className="attraction-image-grid-v2"><img src={a.hinhAnh} onError={e=>e.currentTarget.remove()} alt={a.tenDiaDiem}/></div>:<p>Nhà cung cấp chưa thêm ảnh địa điểm.</p>}
    </section>}

    {tab==='reviews'&&<section className="travel-card-v2 attraction-empty-tab-v2"><h2>Đánh giá từ khách hàng</h2><p>Backend hiện chưa có Review Service/API đánh giá cho địa điểm tham quan. TAKIVIVU không tạo điểm số hoặc nhận xét giả. Khi có API, tab này có thể nối trực tiếp mà không cần đổi luồng đặt vé.</p></section>}

    {tab==='directions'&&<div className="attraction-direction-layout-v2"><section className="travel-card-v2"><h2>Chỉ đường đến {a.tenDiaDiem}</h2><div className="direction-points-v2"><div><span className="blue"><Navigation/></span><div><b>Vị trí hiện tại</b><small>Chọn điểm xuất phát trên bản đồ của bạn</small></div></div><div><span className="red"><MapPin/></span><div><b>{a.tenDiaDiem}</b><small>{fullAddress}</small></div></div></div><a className="direction-link-v2" target="_blank" rel="noreferrer" href={googleMapDirections(a.viDo,a.kinhDo,fullAddress)}><ExternalLink/>Xem đường đi trên Google Maps</a></section><div className="travel-map-frame-v2 large"><GoogleMapFrame title="Bản đồ địa điểm" loading="lazy" src={mapUrl}/></div></div>}
  </div></div>
}
