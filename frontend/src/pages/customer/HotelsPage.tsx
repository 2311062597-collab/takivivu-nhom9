import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hotel as HotelIcon,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UsersRound,
  Wifi,
  Waves,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hotelApi, promotionApi } from '../../api/services'
import type { PromotionApiResponse } from '../../data/promotions'
import type { Hotel as HotelType } from '../../types'
import { apiError, money } from '../../utils/format'
import { EmptyState, ErrorState, Loading } from '../../components/UI'

function isoOffset(days:number){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function displayCity(value:string){return value === 'Da Nang' ? 'Đà Nẵng' : value}
function promoText(p?:PromotionApiResponse){if(!p)return '';return p.discountType==='PERCENTAGE'?`Ưu đãi ${Number(p.discountValue)}%`:`Ưu đãi ${money(Number(p.discountValue))}`}
function lowest(h:HotelType){const prices=(h.danhSachPhong||[]).filter(r=>r.trangThai==='AVAILABLE').map(r=>Number(r.giaMoiDem));return prices.length?Math.min(...prices):0}
function promoForHotel(h:HotelType,promos:PromotionApiResponse[]){const roomIds=new Set((h.danhSachPhong||[]).map(r=>r.id));return promos.find(p=>(p.providerId==null||p.providerId===h.nhaCungCapId)&&(!p.serviceIds?.length||p.serviceIds.some(id=>roomIds.has(id))))}

export default function HotelsPage(){
  const [sp,setSp]=useSearchParams()
  const [form,setForm]=useState({
    thanhPho:sp.get('thanhPho')||'',
    ngayNhanPhong:sp.get('ngayNhanPhong')||isoOffset(7),
    ngayTraPhong:sp.get('ngayTraPhong')||isoOffset(10),
    soKhach:Math.max(1,Number(sp.get('soKhach')||2)),
  })
  const [data,setData]=useState<HotelType[]>([])
  const [promos,setPromos]=useState<PromotionApiResponse[]>([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [star,setStar]=useState<number|''>('')
  const [maxPrice,setMaxPrice]=useState<number|null>(null)
  const [globalMax,setGlobalMax]=useState(0)
  const [sort,setSort]=useState('popular')
  const [view,setView]=useState<'list'|'map'>('list')
  const [page,setPage]=useState(1)

  const run=async(next=form)=>{
    if(!next.thanhPho||!next.ngayNhanPhong||!next.ngayTraPhong)return
    setLoading(true);setError('')
    try{

      const [hotels, activePromos]=await Promise.all([
        hotelApi.search(next),
        promotionApi.available({serviceType:'HOTEL'}).catch(()=>[] as PromotionApiResponse[]),
      ])
      setData(hotels);setPromos(activePromos);setPage(1)
    }catch(e){setError(apiError(e))}finally{setLoading(false)}
  }
  const showAll=async()=>{
    setLoading(true);setError('')
    try{
      const [hotels,activePromos]=await Promise.all([
        hotelApi.catalog(),
        promotionApi.available({serviceType:'HOTEL'}).catch(()=>[] as PromotionApiResponse[]),
      ])
      setData(hotels);setPromos(activePromos);setPage(1)
    }catch(e){setError(apiError(e))}finally{setLoading(false)}
  }
  useEffect(()=>{Promise.all([hotelApi.catalog(),hotelApi.globalMaxPhysicalPrice().catch(()=>0)]).then(([hotels,physicalMax])=>setGlobalMax(Math.max(0,Number(physicalMax),...hotels.flatMap(h=>(h.danhSachPhong||[]).map(r=>Number(r.giaMoiDem)||0))))).catch(()=>{})},[])
  useEffect(()=>{
    if(sp.get('thanhPho')&&sp.get('ngayNhanPhong')&&sp.get('ngayTraPhong')) void run()
    else void showAll()
    // initial URL state only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const submit=(e:FormEvent)=>{e.preventDefault();setSp({...form,soKhach:String(form.soKhach)});void run(form)}
  const nights=useMemo(()=>Math.max(1,Math.ceil((new Date(form.ngayTraPhong).getTime()-new Date(form.ngayNhanPhong).getTime())/86400000)||1),[form.ngayNhanPhong,form.ngayTraPhong])
  const filtered=useMemo(()=>{
    let items=data.filter(h=>(!star||h.soSao===star)&&(maxPrice===null||(h.danhSachPhong||[]).some(r=>r.trangThai==='AVAILABLE'&&Number(r.giaMoiDem)<=maxPrice)))
    if(sort==='price')items=[...items].sort((a,b)=>lowest(a)-lowest(b))
    if(sort==='stars')items=[...items].sort((a,b)=>(b.soSao||0)-(a.soSao||0))
    return items
  },[data,star,sort,maxPrice])
  const perPage=3
  const pages=Math.max(1,Math.ceil(filtered.length/perPage))
  const shown=filtered.slice((page-1)*perPage,page*perPage)

  return <div className="customer-page hotel-customer-v2">
    <section className="hotel-search-hero-v2">
      <div className="container hotel-hero-content-v2">
        <div className="hotel-crumb-v2">Trang chủ <span>›</span> Khách sạn</div>
        <h1>{form.thanhPho ? `Khách sạn tại ${displayCity(form.thanhPho)}` : 'Khách sạn nổi bật'}</h1>
        <p>Tìm khách sạn và phòng phù hợp từ dữ liệu nhà cung cấp trên TAKIVIVU.</p>
        <form className="hotel-search-bar-v2" onSubmit={submit}>
          <label><span>Địa điểm</span><div><MapPin/><input required value={form.thanhPho} onChange={e=>setForm({...form,thanhPho:e.target.value})} placeholder="Đà Nẵng"/></div></label>
          <label><span>Nhận phòng</span><div><CalendarDays/><input required type="date" value={form.ngayNhanPhong} onChange={e=>setForm({...form,ngayNhanPhong:e.target.value})}/></div></label>
          <label><span>Trả phòng</span><div><CalendarDays/><input required type="date" value={form.ngayTraPhong} onChange={e=>setForm({...form,ngayTraPhong:e.target.value})}/></div></label>
          <label><span>Số khách</span><div><UsersRound/><input min={1} type="number" value={form.soKhach} onChange={e=>setForm({...form,soKhach:Number(e.target.value)})}/></div></label>
          <button><Search/>Tìm kiếm</button>
        </form>
      </div>
    </section>

    <div className="container hotel-results-shell-v2">
      <aside className="hotel-filter-v2">
        <div className="filter-title-v2"><h3>Bộ lọc tìm kiếm</h3><button onClick={()=>{setStar('');setMaxPrice(null)}}>Xóa tất cả</button></div>
        <section><strong>Khoảng giá (1 đêm)</strong><input type="range" min="0" max={Math.max(1,globalMax)} value={maxPrice===null?Math.max(1,globalMax):Math.min(maxPrice,Math.max(1,globalMax))} onChange={e=>{setMaxPrice(Number(e.target.value));setPage(1)}}/><div className="range-labels"><span>0 VNĐ</span><span>{money(maxPrice===null?globalMax:maxPrice)}</span></div></section>
        <section><strong>Hạng sao</strong>{[5,4,3,2,1].map(n=><label className="check-filter" key={n}><input type="checkbox" checked={star===n} onChange={()=>setStar(star===n?'':n)}/><span>{'★'.repeat(n)}</span></label>)}</section>
        <div className="hotel-filter-note"><ShieldCheck/><span>Kết quả và tình trạng phòng lấy trực tiếp từ Hotel Service.</span></div>
      </aside>

      <section className="hotel-results-v2">
        <div className="hotel-results-head-v2"><div><h2>{loading?'Đang tìm...':`Tìm thấy ${filtered.length} khách sạn`}</h2><p>Giá hiển thị theo phòng khả dụng, {nights} đêm.</p></div><div className="hotel-sort-v2"><span>Sắp xếp</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Phổ biến nhất</option><option value="price">Giá thấp nhất</option><option value="stars">Hạng sao</option></select><button className={view==='list'?'active':''} onClick={()=>setView('list')}>Danh sách</button><button className={view==='map'?'active':''} onClick={()=>setView('map')}>Bản đồ</button></div></div>
        {loading?<Loading label="Đang tải khách sạn..."/>:error?<ErrorState message={error} onRetry={()=>void run()}/>:filtered.length===0?<EmptyState title="Chưa tìm thấy khách sạn phù hợp"/>:<div className={view==='map'?'hotel-list-map-v2':'hotel-list-v2'}>
          <div className="hotel-list-column-v2">{shown.map((h)=>{const promo=promoForHotel(h,promos);return <article className="hotel-result-v2" key={h.id}>
            <div className="hotel-result-image-v2" style={h.hinhAnh?{backgroundImage:`url("${h.hinhAnh}")`}:undefined}>{promo&&<span className="hotel-promo-badge-v2">{promoText(promo)}</span>}</div>
            <div className="hotel-result-main-v2"><div className="hotel-result-title-v2"><h3>{h.tenKhachSan}</h3><span>{'★'.repeat(Math.max(0,Math.min(5,h.soSao||0)))}</span></div><p className="hotel-address-v2"><MapPin/>{h.diaChi}, {displayCity(h.thanhPho)}</p><div className="hotel-chips-v2">{(h.tienNghi||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,2).map(t=><span key={t}><CheckCircle2/>{t}</span>)}<span><CheckCircle2/>Còn {h.danhSachPhong?.reduce((s,r)=>s+r.soPhongConLai,0)||0} phòng</span></div><p className="hotel-description-v2">{h.moTa||'Nhà cung cấp chưa cập nhật mô tả khách sạn.'}</p>{promo&&<div className="hotel-provider-promo-v2"><Sparkles/>Mã <b>{promo.code}</b> từ {promo.providerName}</div>}</div>
            <div className="hotel-result-side-v2"><div className="hotel-score-v2"><b>{h.soSao ? `${h.soSao}/5`:'—'}</b><span>Hạng sao khách sạn</span></div><small>Giá phòng từ</small><strong>{lowest(h)?money(lowest(h)):'Liên hệ'}</strong><em>/ đêm</em><Link to={`/hotels/${h.id}?checkIn=${form.ngayNhanPhong}&checkOut=${form.ngayTraPhong}&guests=${form.soKhach}`}>Xem chi tiết →</Link></div>
          </article>})}</div>
          {view==='map'&&<div className="hotel-map-v2"><div className="hotel-map-grid-v2"/>{shown.map((h,i)=><span className={`hotel-map-price-v2 pin-${i%6}`} key={h.id}>{lowest(h)?money(lowest(h)).replace(' ',' '):'KS'}</span>)}<div className="hotel-map-city-v2"><MapPin/><b>{displayCity(form.thanhPho)}</b></div></div>}
        </div>}
        {filtered.length>0&&<div className="hotel-pagination-v2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button>{Array.from({length:pages},(_,i)=>i+1).map(n=><button className={page===n?'active':''} key={n} onClick={()=>setPage(n)}>{n}</button>)}<button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button></div>}
      </section>
    </div>
  </div>
}
