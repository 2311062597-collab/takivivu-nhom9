import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { attractionApi, promotionApi } from '../../api/services'
import type { PromotionApiResponse } from '../../data/promotions'
import type { Attraction } from '../../types'
import { apiError, money } from '../../utils/format'
import { EmptyState, ErrorState, Loading } from '../../components/UI'

function isoOffset(days:number){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function displayCity(v:string){return v==='Da Nang'?'Đà Nẵng':v}
function minTicket(a:Attraction){const prices=(a.danhSachLoaiVe||[]).filter(v=>v.trangThai==='AVAILABLE').map(v=>Number(v.giaVe));return prices.length?Math.min(...prices):0}
function promoForAttraction(a:Attraction,promos:PromotionApiResponse[]){const ids=new Set((a.danhSachLoaiVe||[]).map(v=>v.id));return promos.find(p=>(p.providerId==null||p.providerId===a.nhaCungCapId)&&(!p.serviceIds?.length||p.serviceIds.some(id=>ids.has(id))))}
function promoText(p?:PromotionApiResponse){if(!p)return '';return p.discountType==='PERCENTAGE'?`Ưu đãi ${Number(p.discountValue)}%`:`Ưu đãi ${money(Number(p.discountValue))}`}

export default function AttractionsPage(){
  const [sp,setSp]=useSearchParams()
  const [form,setForm]=useState({thanhPho:sp.get('thanhPho')||'Da Nang',ngaySuDung:sp.get('ngaySuDung')||isoOffset(7),soLuongVe:Math.max(1,Number(sp.get('soLuongVe')||1))})
  const [data,setData]=useState<Attraction[]>([]);const [promos,setPromos]=useState<PromotionApiResponse[]>([])
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [q,setQ]=useState('');const [sort,setSort]=useState('popular');const [page,setPage]=useState(1)
  const [cityFilter,setCityFilter]=useState('');const [typeFilters,setTypeFilters]=useState<string[]>([]);const [maxPrice,setMaxPrice]=useState(Number.POSITIVE_INFINITY)
  const run=async()=>{setLoading(true);setError('');try{const [items,ps]=await Promise.all([attractionApi.catalog(),promotionApi.available({serviceType:'ATTRACTION'}).catch(()=>[] as PromotionApiResponse[])]);setData(items.filter(item=>item.trangThai==='ACTIVE'));setPromos(ps);setPage(1)}catch(e){setError(apiError(e))}finally{setLoading(false)}}
  useEffect(()=>{void run()},[])
  const submit=(e:FormEvent)=>{e.preventDefault();setSp({...form,soLuongVe:String(form.soLuongVe)});setCityFilter(form.thanhPho);setPage(1)}
  const filtered=useMemo(()=>{let items=data.filter(a=>{const text=`${a.tenDiaDiem} ${a.diaChi} ${a.thanhPho} ${a.moTa}`.toLowerCase();const cityOk=!cityFilter||displayCity(a.thanhPho).toLowerCase()===displayCity(cityFilter).toLowerCase()||text.includes(cityFilter.toLowerCase());const qOk=!q||text.includes(q.toLowerCase());const price=minTicket(a);const priceOk=!price||price<=maxPrice;const typeOk=!typeFilters.length||typeFilters.includes(a.loaiDiaDiem);return cityOk&&qOk&&priceOk&&typeOk});if(sort==='price')items=[...items].sort((a,b)=>minTicket(a)-minTicket(b));if(sort==='name')items=[...items].sort((a,b)=>a.tenDiaDiem.localeCompare(b.tenDiaDiem,'vi'));return items},[data,q,sort,cityFilter,typeFilters,maxPrice])
  const availableTypes=useMemo(()=>Array.from(new Set(data.map(a=>a.loaiDiaDiem).filter(Boolean))).sort(),[data]);const priceCeiling=useMemo(()=>Math.max(3000000,...data.map(minTicket).filter(Number.isFinite)),[data]);
  const areas=useMemo(()=>Array.from(new Set(data.map(a=>displayCity(a.thanhPho)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'vi')),[data])
  const perPage=6,pages=Math.max(1,Math.ceil(filtered.length/perPage)),shown=filtered.slice((page-1)*perPage,page*perPage)
  return <div className="customer-page attraction-customer-v2">
    <section className="attraction-search-hero-v2"><div className="container"><div className="travel-breadcrumb-light-v2">Trang chủ <span>›</span> Địa điểm tham quan</div><span className="attraction-kicker-v2">KHÁM PHÁ VIỆT NAM</span><h1>Địa điểm tham quan</h1><p>Trải nghiệm những điểm đến hấp dẫn được nhà cung cấp đăng tải trên TAKIVIVU.</p><form className="attraction-search-bar-v2" onSubmit={submit}><label><span>Điểm đến / Tên địa điểm</span><div><MapPin/><input required value={form.thanhPho} onChange={e=>setForm({...form,thanhPho:e.target.value})}/></div></label><label><span>Ngày tham quan</span><div><CalendarDays/><input required type="date" value={form.ngaySuDung} onChange={e=>setForm({...form,ngaySuDung:e.target.value})}/></div></label><label><span>Số vé</span><div><UsersRound/><input min={1} type="number" value={form.soLuongVe} onChange={e=>setForm({...form,soLuongVe:Number(e.target.value)})}/></div></label><button><Search/>Tìm kiếm</button></form></div></section>
    <div className="container attraction-content-v2"><div className="attraction-city-pills-v2"><button className={!cityFilter?'active':''} onClick={()=>{setCityFilter('');setPage(1)}}>Tất cả</button>{['Đà Nẵng','Hà Nội','TP. Hồ Chí Minh','Quảng Ninh','Ninh Bình','Huế','Hội An'].map(v=><button key={v} className={displayCity(cityFilter)===v?'active':''} onClick={()=>{const city=v==='Đà Nẵng'?'Da Nang':v;setForm(f=>({...f,thanhPho:city}));setCityFilter(city);setPage(1)}}>{v}</button>)}<select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Sắp xếp: Phổ biến</option><option value="price">Giá thấp nhất</option><option value="name">Tên A-Z</option></select></div>
      <div className="attraction-results-layout-v2"><aside className="attraction-filter-v2"><div><h3>Bộ lọc tìm kiếm</h3><button onClick={()=>{setQ('');setCityFilter('');setTypeFilters([]);setMaxPrice(Number.POSITIVE_INFINITY);setPage(1)}}>Xóa tất cả</button></div><label className="attraction-search-mini-v2"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên địa điểm..."/></label><section><strong>Khu vực</strong><label><input type="checkbox" checked={!cityFilter} onChange={()=>{setCityFilter('');setPage(1)}}/> Tất cả khu vực</label>{areas.map(v=><label key={v}><input type="checkbox" checked={displayCity(cityFilter)===v} onChange={e=>{setCityFilter(e.target.checked?(v==='Đà Nẵng'?'Da Nang':v):'');setPage(1)}}/> {v}</label>)}</section><section><strong>Loại địa điểm</strong>{availableTypes.map(v=><label key={v}><input type="checkbox" checked={typeFilters.includes(v)} onChange={e=>{setTypeFilters(x=>e.target.checked?[...x,v]:x.filter(t=>t!==v));setPage(1)}}/> {v}</label>)}</section><section><strong>Mức giá</strong><input type="range" min="0" max={priceCeiling} step="50000" value={Number.isFinite(maxPrice)?maxPrice:priceCeiling} onChange={e=>{setMaxPrice(Number(e.target.value));setPage(1)}}/><small>{Number.isFinite(maxPrice)?`Tối đa ${money(maxPrice)}`:"Không giới hạn giá"}</small></section></aside>
        <main className="attraction-results-main-v2"><div className="attraction-results-head-v2"><h2>Có {filtered.length} địa điểm tham quan phù hợp</h2><button><SlidersHorizontal/>Bộ lọc</button></div>{loading?<Loading label="Đang tải địa điểm..."/>:error?<ErrorState message={error} onRetry={()=>void run()}/>:filtered.length===0?<EmptyState title="Chưa tìm thấy địa điểm phù hợp"/>:<div className="attraction-grid-v2">{shown.map((a)=>{const promo=promoForAttraction(a,promos);const src=a.hinhAnh;return <article className="attraction-card-v2" key={a.id}><div className="attraction-card-image-v2">{src?<img src={src} onError={e=>{e.currentTarget.remove()}} alt={a.tenDiaDiem}/>:<span>Chưa có ảnh</span>}{promo&&<span>{promoText(promo)}</span>}</div><div className="attraction-card-body-v2"><div className="attraction-card-title-v2"><h3>{a.tenDiaDiem}</h3><span className="attraction-status-v2">{a.trangThai==='ACTIVE'?'Đang mở':'Tạm ngưng'}</span></div><p><MapPin/>{a.diaChi}, {displayCity(a.thanhPho)}</p><div className="attraction-tags-v2"><span>Vé điện tử</span><span>Xác nhận nhanh</span><span>Có vé điện tử</span></div>{promo&&<div className="attraction-provider-promo-v2">Mã <b>{promo.code}</b> từ {promo.providerName}</div>}<div className="attraction-card-foot-v2"><div><small>Giá từ</small><strong>{minTicket(a)?money(minTicket(a)):'Chưa có giá'}</strong><span>/người</span></div><Link to={`/attractions/${a.id}?date=${form.ngaySuDung}&qty=${form.soLuongVe}`}>Xem chi tiết →</Link></div></div></article>})}</div>}
          {filtered.length>0&&<div className="flight-pagination attraction-pagination-v2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button>{Array.from({length:Math.min(5,pages)},(_,i)=>i+1).map(n=><button key={n} className={page===n?'active':''} onClick={()=>setPage(n)}>{n}</button>)}<button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button></div>}
        </main></div>
    </div>
  </div>
}
