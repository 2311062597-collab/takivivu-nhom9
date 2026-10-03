import { CalendarDays, ChevronRight, Crown, Headphones, Hotel, Mail, MapPin, Plane, Search, ShieldCheck, Tag, UsersRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, type FormEvent } from 'react'
import { fromPromotionApi, promotionScopeText, promotionValueText, type Promotion } from '../../data/promotions'
import type { Attraction } from '../../types'
import { attractionApi, promotionApi } from '../../api/services'


export default function HomePage(){
  const navigate = useNavigate()
  const [tab,setTab] = useState<'flight'|'hotel'|'attraction'>('flight')
  const [q,setQ] = useState({a:'Hà Nội', b:'Đà Nẵng', date:'2026-09-15', end:'2026-09-20', people:1})
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [attractions, setAttractions] = useState<Attraction[]>([])
  useEffect(() => {
    let active = true
    Promise.allSettled([promotionApi.available(), attractionApi.catalog()]).then(([promoResult, attractionResult]) => {
      if (!active) return
      setPromotions(promoResult.status === 'fulfilled' ? promoResult.value.map(fromPromotionApi).slice(0, 4) : [])
      setAttractions(attractionResult.status === 'fulfilled' ? attractionResult.value.filter(item => item.trangThai === 'ACTIVE') : [])
    })
    return () => { active = false }
  }, [])
  const heroPromotion = promotions[0] || null
  const destinations = Array.from(attractions.reduce((map, item) => {
    const city = item.thanhPho?.trim()
    if (!city) return map
    const current = map.get(city) || { city, count: 0, image: '' }
    current.count += 1
    if (!current.image && item.hinhAnh) current.image = item.hinhAnh.split(',')[0].trim()
    map.set(city, current)
    return map
  }, new Map<string, { city: string; count: number; image: string }>()).values()).slice(0, 5)

  const submit=(e:FormEvent)=>{
    e.preventDefault()
    const p=new URLSearchParams()
    if(tab==='flight'){
      p.set('diemDi',q.a); p.set('diemDen',q.b); p.set('ngayKhoiHanh',q.date); p.set('passengers',String(q.people));
      navigate(`/flights?${p}`)
    }
    if(tab==='hotel'){
      p.set('thanhPho',q.b||q.a); p.set('ngayNhanPhong',q.date); p.set('ngayTraPhong',q.end); p.set('soKhach',String(q.people));
      navigate(`/hotels?${p}`)
    }
    if(tab==='attraction'){
      p.set('thanhPho',q.b||q.a); p.set('ngaySuDung',q.date); p.set('soLuongVe',String(q.people));
      navigate(`/attractions?${p}`)
    }
  }

  return <div className="home-reference-page">
    <section className="home-ref-hero"><div className="home-ref-hero-shade"/><div className="container home-ref-hero-content"><div className="home-ref-copy"><h1>Mỗi chuyến đi<br/>là một câu chuyện đẹp.</h1><p>Khám phá hành trình trải nghiệm du lịch<br/>với mức giá tốt nhất cùng TAKIVIVU.</p></div><div className="home-ref-script">Đi xa hơn<br/>để yêu thêm cuộc sống</div>
      <form className="home-ref-search" onSubmit={submit}><div className="home-ref-search-tabs"><button type="button" className={tab==='flight'?'active':''} onClick={()=>setTab('flight')}><Plane/>Chuyến bay</button><button type="button" className={tab==='hotel'?'active':''} onClick={()=>setTab('hotel')}><Hotel/>Khách sạn</button><button type="button" className={tab==='attraction'?'active':''} onClick={()=>setTab('attraction')}><MapPin/>Địa điểm tham quan</button></div><div className="home-ref-search-fields">
        {tab==='flight'&&<><label><span>Điểm đi</span><div><MapPin/><input value={q.a} onChange={e=>setQ({...q,a:e.target.value})}/></div></label><button type="button" className="swap-button" onClick={()=>setQ({...q,a:q.b,b:q.a})}>⇄</button><label><span>Điểm đến</span><div><MapPin/><input value={q.b} onChange={e=>setQ({...q,b:e.target.value})}/></div></label></>}
        {tab!=='flight'&&<label className="destination-field"><span>Điểm đến</span><div><MapPin/><input value={q.b} onChange={e=>setQ({...q,b:e.target.value})}/></div></label>}
        <label><span>{tab==='hotel'?'Nhận phòng':'Ngày đi'}</span><div><CalendarDays/><input type="date" value={q.date} onChange={e=>setQ({...q,date:e.target.value})}/></div></label>{tab==='hotel'&&<label><span>Trả phòng</span><div><CalendarDays/><input type="date" value={q.end} onChange={e=>setQ({...q,end:e.target.value})}/></div></label>}<label><span>Hành khách</span><div><UsersRound/><input type="number" min={1} value={q.people} onChange={e=>setQ({...q,people:Number(e.target.value)})}/><small>người</small></div></label><button className="home-ref-search-btn"><Search/>Tìm kiếm</button>
      </div></form></div></section>

    <main className="container home-ref-main">
      <section className="home-ref-benefits"><article><Tag/><div><strong>Giá tốt mỗi ngày</strong><span>Không ngừng cập nhật ưu đãi</span></div></article><article><ShieldCheck/><div><strong>Thanh toán an toàn</strong><span>Bảo mật thông tin thanh toán</span></div></article><article><Headphones/><div><strong>Hỗ trợ 24/7</strong><span>Luôn sẵn sàng hỗ trợ bạn</span></div></article><article><Crown/><div><strong>Trải nghiệm tin cậy</strong><span>Yên tâm trên mọi hành trình</span></div></article></section>

      <section className="home-ref-season-banner provider-promo-banner"><div><span>{heroPromotion ? `Ưu đãi từ ${heroPromotion.providerName}` : 'Ưu đãi mùa thu'}</span><h2>{heroPromotion?.name || 'Khám phá nhiều hơn - Tiết kiệm hơn'}</h2><p>{heroPromotion?.description || 'Ưu đãi hấp dẫn cho chuyến bay, khách sạn và những điểm đến nổi bật.'}</p><Link to={heroPromotion ? `/promotions/${heroPromotion.id}` : '/promotions'}>Xem ưu đãi <ChevronRight/></Link></div><div className="season-discount"><small>{heroPromotion ? 'Mức ưu đãi' : 'Giảm đến'}</small><strong>{heroPromotion ? promotionValueText(heroPromotion) : '30%'}</strong><span>{heroPromotion ? `Mã ${heroPromotion.code}` : 'trong tháng'}</span></div></section>

      <section className="home-ref-section"><div className="home-ref-title"><div><h2>Dịch vụ nổi bật</h2><p>Đa dạng lựa chọn cho mọi hành trình</p></div></div><div className="home-ref-services"><Link to="/flights" className="service-photo service-flight"><div><h3>Chuyến bay</h3><p>Bay khắp thế giới với giá tốt nhất</p></div><span><ChevronRight/></span></Link><Link to="/hotels" className="service-photo service-hotel"><div><h3>Khách sạn</h3><p>Nghỉ ngơi thoải mái ở mọi điểm đến</p></div><span><ChevronRight/></span></Link><Link to="/attractions" className="service-photo service-attraction"><div><h3>Địa điểm tham quan</h3><p>Khám phá những trải nghiệm đáng nhớ</p></div><span><ChevronRight/></span></Link></div></section>

      <section className="home-ref-section home-featured-promotions"><div className="home-ref-title"><div><h2>Ưu đãi nổi bật</h2><p>Đừng bỏ lỡ những deal hấp dẫn hôm nay!</p></div><Link to="/promotions">Xem tất cả <ChevronRight/></Link></div>{promotions.length>0?<div className="home-provider-promotions">{promotions.map(item=><Link to={`/promotions/${item.id}`} className={`home-provider-promo scope-${item.scope.toLowerCase()}`} key={item.id}><div className="provider-promo-visual"><Tag/><b>{promotionValueText(item)}</b></div><div><h3>{item.name}</h3><p>{promotionScopeText(item.scope)} · {item.serviceName}</p><span>Nhà cung cấp: {item.providerName}</span><strong>Mã {item.code}</strong></div></Link>)}</div>:<div className="home-promo-empty"><Tag/><div><strong>Ưu đãi đang được cập nhật</strong><span>Các ưu đãi ACTIVE từ nhà cung cấp sẽ hiển thị tại đây.</span></div><Link to="/promotions">Khám phá ưu đãi <ChevronRight/></Link></div>}</section>

      {destinations.length>0&&<section className="home-ref-section"><div className="home-ref-title"><div><h2>Điểm đến yêu thích</h2><p>Khám phá những điểm đến đang có dữ liệu tham quan trên TAKIVIVU</p></div><Link to="/attractions">Xem tất cả <ChevronRight/></Link></div><div className="home-ref-destinations">{destinations.map(item=><Link key={item.city} to={`/attractions?thanhPho=${encodeURIComponent(item.city)}`} className="destination-card" style={item.image?{backgroundImage:`url(${item.image})`}:undefined}><div><strong>{item.city}</strong><span>{item.count} địa điểm tham quan</span></div></Link>)}</div></section>}

      <section className="home-ref-newsletter-v8">
        <div className="newsletter-mail-v8"><Mail/></div>
        <div><strong>Đăng ký nhận ưu đãi mới nhất</strong><span>Cập nhật những khuyến mãi hấp dẫn và kinh nghiệm du lịch hữu ích.</span></div>
        <form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Nhập email của bạn" aria-label="Email nhận ưu đãi"/><button type="submit">Đăng ký</button></form>
        <Plane className="newsletter-plane-v8"/>
      </section>

    </main>
  </div>
}
