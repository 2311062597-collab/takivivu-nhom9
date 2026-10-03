import { ArrowLeft, ArrowRight, BaggageClaim, BedDouble, CalendarDays, Check, CheckCircle2, Headphones, MapPin, Plane, ShieldCheck, Ticket, UtensilsCrossed, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { attractionApi, authApi, bookingApi, flightApi, hotelApi, promotionApi } from '../../api/services'
import { useAuth } from '../../contexts/AuthContext'
import type { Attraction, Flight, Hotel, Profile, Room, ServiceType, TicketType } from '../../types'
import { apiError, money } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'

type Passenger = { ho: string; tenDem: string; ten: string; gioiTinh: string; ngaySinh: string; quocTich: string; giayTo: string; hetHan: string }
type Extras = { hanhLy: boolean; choNgoi: boolean; suatAn: boolean; baoHiem: boolean }

const blankPassenger = (): Passenger => ({ ho: '', tenDem: '', ten: '', gioiTinh: 'Ông', ngaySinh: '', quocTich: 'Việt Nam', giayTo: '', hetHan: '' })

// Show a customer-friendly message instead of the raw HTTP 400 response.
function bookingPromotionError(err: unknown, selectedCode: string, clearSelection: () => void): string {
  const raw = apiError(err)
  if (selectedCode && /giới hạn sử dụng ưu đãi|đã sử dụng ưu đãi|hết lượt sử dụng/i.test(raw)) {
    clearSelection()
    return `Bạn đã sử dụng ưu đãi ${selectedCode} hoặc đã hết lượt áp dụng. Mã đã được bỏ chọn; vui lòng chọn ưu đãi khác hoặc tiếp tục không dùng ưu đãi.`
  }
  return raw
}

function hm(value: string) { return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
function date(value: string) { return new Date(value).toLocaleDateString('vi-VN') }

export default function BookingCreatePage() {
  const [sp] = useSearchParams()
  const type = (sp.get('type') || 'FLIGHT') as ServiceType
  if (type === 'HOTEL') return <HotelBookingCreate/>
  if (type === 'ATTRACTION') return <AttractionBookingCreate/>
  return <FlightBookingCreate/>
}

function FlightBookingCreate() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const id = Number(sp.get('id'))
  const seatCodes = (sp.get('seats') || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean)
  const [flight, setFlight] = useState<Flight | null>(null)
  const [inventory, setInventory] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [passengers, setPassengers] = useState<any[]>([])
  const [contact, setContact] = useState({ hoTen: session?.hoTen || '', email: session?.email || '', soDienThoai: '' })
  const [promotions,setPromotions]=useState<any[]>([])
  const [promotionCode,setPromotionCode]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({})

  useEffect(()=>{
    Promise.all([flightApi.detail(id),flightApi.inventory(id),authApi.profile().catch(()=>null)])
      .then(async([f,inv,p])=>{
        setFlight(f);setInventory(inv)
        if(p){setProfile(p);setContact({hoTen:p.hoTen||'',email:p.email||'',soDienThoai:p.soDienThoai||''})}
        const chosen=inv.seats.filter((s:any)=>seatCodes.includes(String(s.maGhe).toUpperCase()))
        if(!chosen.length)throw new Error('Bạn chưa chọn ghế. Vui lòng quay lại sơ đồ ghế.')
        if(chosen.some((s:any)=>s.trangThai!=='AVAILABLE'))throw new Error('Có ghế vừa được người khác giữ hoặc đặt. Vui lòng chọn lại ghế.')
        setPassengers(chosen.map((s:any,index:number)=>({
          maGhe:s.maGhe,hangVe:s.hangVe,
          hoTen:index===0?(p?.hoTen||session?.hoTen||''):'',
          ngaySinh:'',quocTich:'Việt Nam',cccd:'',hoChieu:''
        })))
        const total=chosen.reduce((sum:number,s:any)=>sum+Number(inv.fares.find((x:any)=>x.hangVe===s.hangVe)?.giaVe||0),0)
        const ps=await promotionApi.available({serviceType:'FLIGHT',serviceId:f.id,providerId:f.nhaCungCapId}).catch(()=>[])
        const eligible=ps.filter((x:any)=>Number(x.minOrderAmount||0)<=total)
        setPromotions(eligible)
        if(eligible.length){
          const best=[...eligible].sort((a:any,b:any)=>{
            const calc=(x:any)=>x.discountType==='PERCENTAGE'?Math.min(total*Number(x.discountValue||0)/100,Number(x.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Number(x.discountValue||0)
            return calc(b)-calc(a)
          })[0]
          setPromotionCode(best.code)
        }
      })
      .catch(e=>setError(apiError(e)))
      .finally(()=>setLoading(false))
  },[id,sp.get('seats')])

  const selectedSeats=useMemo(()=>{
    if(!inventory)return []
    return inventory.seats.filter((s:any)=>seatCodes.includes(String(s.maGhe).toUpperCase())).map((s:any)=>({
      ...s,giaVe:Number(inventory.fares.find((f:any)=>f.hangVe===s.hangVe)?.giaVe||0)
    }))
  },[inventory,sp.get('seats')])
  const groups=useMemo(()=>{
    const m=new Map<string,{hangVe:string;soLuong:number;giaVe:number;thanhTien:number}>()
    selectedSeats.forEach((s:any)=>{const cur=m.get(s.hangVe)||{hangVe:s.hangVe,soLuong:0,giaVe:s.giaVe,thanhTien:0};cur.soLuong++;cur.thanhTien+=s.giaVe;m.set(s.hangVe,cur)})
    return [...m.values()]
  },[selectedSeats])
  const subtotal=groups.reduce((s,x)=>s+x.thanhTien,0)
  const chosenPromotion=promotions.find((p:any)=>p.code===promotionCode)
  const discount=chosenPromotion?(chosenPromotion.discountType==='PERCENTAGE'?Math.min(subtotal*Number(chosenPromotion.discountValue||0)/100,Number(chosenPromotion.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Math.min(subtotal,Number(chosenPromotion.discountValue||0))):0
  const total=Math.max(0,subtotal-discount)

  const updatePassenger=(index:number,key:string,value:string)=>setPassengers(cur=>cur.map((p,i)=>i===index?{...p,[key]:value}:p))
  const submit=async(e:FormEvent)=>{
    e.preventDefault()
    if(!flight||!inventory)return
    const errors:Record<string,string>={}
    passengers.forEach((p,i)=>{
      if(!p.hoTen.trim())errors[`${i}.hoTen`]='Vui lòng nhập họ và tên.'
      if(!p.ngaySinh)errors[`${i}.ngaySinh`]='Vui lòng chọn ngày sinh.'
      else if(p.ngaySinh>new Date().toISOString().slice(0,10))errors[`${i}.ngaySinh`]='Ngày sinh không được ở tương lai.'
      if(!p.quocTich.trim())errors[`${i}.quocTich`]='Vui lòng nhập quốc tịch.'
      if(!/^\d{12}$/.test(p.cccd.trim()))errors[`${i}.cccd`]='CCCD phải gồm đúng 12 chữ số.'
      if(!/^[A-Za-z0-9]{6,12}$/.test(p.hoChieu.trim()))errors[`${i}.hoChieu`]='Hộ chiếu phải gồm 6–12 ký tự chữ hoặc số.'
    })
    setFieldErrors(errors)
    if(Object.keys(errors).length){setError('Vui lòng kiểm tra và nhập đầy đủ CCCD, hộ chiếu cùng thông tin từng hành khách.');return}

    if(!contact.hoTen||!contact.email||!contact.soDienThoai){setError('Thông tin người thanh toán chưa đầy đủ. Vui lòng cập nhật hồ sơ.');return}
    setBusy(true);setError('')
    try{
      const thongTinBoSung=JSON.stringify({
        loaiDatVe:'FLIGHT',
        contact,
        selectedSeats:selectedSeats.map((s:any)=>({maGhe:s.maGhe,hangVe:s.hangVe,giaVe:s.giaVe})),
        passengers,
        profileId:profile?.id||session?.id||null
      })
      const booking=await bookingApi.create({
        idempotencyKey:crypto.randomUUID(),
        promotionCode:promotionCode||undefined,
        danhSachDichVu:[{loaiDichVu:'FLIGHT',dichVuId:flight.id,soLuong:selectedSeats.length,thongTinBoSung}]
      })
      navigate(`/payments/new?bookingId=${booking.id}`)
    }catch(err){setError(bookingPromotionError(err,promotionCode,()=>setPromotionCode('')))}finally{setBusy(false)}
  }

  if(loading)return <div className="container pad"><Loading label="Đang tải thông tin đặt vé..."/></div>
  if(error&&!flight)return <div className="container pad"><ErrorState message={error}/></div>
  if(!flight||!inventory)return <div className="container pad"><ErrorState message="Không tìm thấy dữ liệu chuyến bay."/></div>

  return <div className="booking-flight-page"><div className="container booking-flight-wrap">
    <div className="flight-ref-breadcrumb">Trang chủ <span>›</span> Chuyến bay <span>›</span> Chọn ghế <span>›</span> Thông tin hành khách</div>
    <div className="booking-title"><h1>Thông tin đặt vé</h1><p>Thông tin người thanh toán và người sở hữu từng vé.</p></div>
    <div className="booking-stepper"><div className="done"><b>✓</b><span>Chọn chuyến</span></div><i/><div className="done"><b>✓</b><span>Chọn ghế</span></div><i/><div className="active"><b>3</b><span>Thông tin hành khách</span></div><i/><div><b>4</b><span>Thanh toán</span></div></div>
    <div className="booking-layout">
      <form onSubmit={submit}>
        {error&&<div className="form-alert">{error}</div>}
        <section className="booking-form-card"><h2>Thông tin người thanh toán</h2><div className="booking-form-grid three">
          <label>Họ và tên<input readOnly value={contact.hoTen}/></label>
          <label>Email<input readOnly value={contact.email}/></label>
          <label>Số điện thoại<input readOnly value={contact.soDienThoai}/></label>
        </div></section>
        <section className="booking-form-card"><h2>Thông tin người sở hữu vé</h2><p className="booking-hint">Mỗi ghế tương ứng một hành khách. Bắt buộc nhập cả CCCD và hộ chiếu.</p>
          {passengers.map((p:any,i:number)=><div className="passenger-panel" key={p.maGhe}>
            <div className="passenger-heading"><UserRound/><strong>Hành khách {i+1}</strong><span>Ghế {p.maGhe} · {p.hangVe}</span></div>
            <div className="booking-form-grid three flight-passenger-fields">
              {([
                ['hoTen','Họ và tên','text'],['ngaySinh','Ngày sinh','date'],['quocTich','Quốc tịch','text'],
                ['cccd','Số CCCD','text'],['hoChieu','Số hộ chiếu','text']
              ] as const).map(([key,label,type])=><label key={key}><span>{label} <em>*</em></span>
                <input required type={type} value={p[key]} max={key==='ngaySinh'?new Date().toISOString().slice(0,10):undefined}
                  inputMode={key==='cccd'?'numeric':undefined} maxLength={key==='cccd'?12:key==='hoChieu'?12:undefined}
                  aria-invalid={!!fieldErrors[`${i}.${key}`]}
                  onChange={e=>{updatePassenger(i,key,e.target.value);setFieldErrors(cur=>{const next={...cur};delete next[`${i}.${key}`];return next})}}/>
                {fieldErrors[`${i}.${key}`]&&<small className="field-error">{fieldErrors[`${i}.${key}`]}</small>}
              </label>)}
            </div>
          </div>)}
        </section>
        <section className="booking-form-card promotion-code-v2"><h2>Ưu đãi</h2><label>Chọn ưu đãi<select value={promotionCode} onChange={e=>setPromotionCode(e.target.value)}><option value="">Không áp dụng ưu đãi</option>{promotions.map((p:any)=><option key={p.id} value={p.code}>{p.name} — {p.code}</option>)}</select></label>{promotions.length===0&&<span className="promotion-empty-v2">Hiện không có ưu đãi đủ điều kiện cho đơn {money(subtotal)}.</span>}</section>
        <div className="booking-bottom-actions"><Link to={`/flights/${flight.id}/seats?passengers=${Math.max(selectedSeats.length,Number(sp.get('passengers')||1))}`}><ArrowLeft/>Quay lại chọn ghế</Link><button className="btn" disabled={busy}>{busy?'Đang tạo Booking...':'Tiếp tục thanh toán'}<ArrowRight/></button></div>
      </form>
      <aside><section className="booking-order-card"><h3>Thông tin đơn hàng</h3><div className="summary-airline"><Plane/><div><strong>{flight.hangHangKhong}</strong><span>{flight.maChuyenBay}</span></div></div><div className="summary-route"><div><strong>{hm(flight.thoiGianKhoiHanh)}</strong><span>{flight.diemDi}</span></div><Plane/><div><strong>{hm(flight.thoiGianDen)}</strong><span>{flight.diemDen}</span></div></div>
        <div className="flight-booking-seat-list">{groups.map(g=><div key={g.hangVe}><span>{g.hangVe} × {g.soLuong}</span><strong>{money(g.thanhTien)}</strong></div>)}</div>
        <div className="summary-line"><span>Ghế</span><strong>{selectedSeats.map((s:any)=>s.maGhe).join(', ')}</strong></div>
        <div className="summary-line"><span>Tạm tính</span><strong>{money(subtotal)}</strong></div>
        {chosenPromotion&&<><div className="summary-line"><span>Ưu đãi ({promotionCode})</span><strong>-{money(discount)}</strong></div></>}
        <div className="summary-line total"><span>Tổng cộng</span><strong>{money(total)}</strong></div>
        <div className="booking-trust"><ShieldCheck/><span>Giá và trạng thái ghế sẽ được backend kiểm tra lại. Ghế được giữ 15 phút sau khi tạo Booking.</span></div>
      </section></aside>
    </div>
  </div></div>
}

function HotelBookingCreate(){
  const [sp]=useSearchParams();const navigate=useNavigate();const {session}=useAuth()
  const id=Number(sp.get('id'));const physicalRoomSelections=(sp.get('physicalRoomIds')||sp.get('physicalRoomId')||'').split(',').filter(Boolean).map(value=>{const parts=value.split(':').map(Number);return {typeId:parts.length===2?parts[0]:id,roomId:parts.length===2?parts[1]:parts[0]}});const physicalRoomIds=physicalRoomSelections.map(r=>r.roomId);const qty=physicalRoomIds.length||Math.max(1,Number(sp.get('qty')||1));const start=sp.get('start')||'';const end=sp.get('end')||'';const guestCount=Math.max(1,Number(sp.get('guests')||1))
  const [room,setRoom]=useState<Room|null>(null);const [selectedRooms,setSelectedRooms]=useState<Room[]>([]);const [hotel,setHotel]=useState<Hotel|null>(null);const [profile,setProfile]=useState<Profile|null>(null)
  const [contact,setContact]=useState({hoTen:session?.hoTen||'',soDienThoai:'',email:session?.email||''})
  const [requests,setRequests]=useState({tangCao:false,giuongDoi:false,khongHutThuoc:false,khac:''})
  const [promotions,setPromotions]=useState<any[]>([])
  const [promotionCode,setPromotionCode]=useState('')
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{Promise.all([hotelApi.room(id),authApi.profile().catch(()=>null),Promise.all(physicalRoomSelections.map(selection=>hotelApi.room(selection.typeId,selection.roomId)))]).then(async([r,p,physical])=>{setRoom(r);setSelectedRooms(physical);if(p){setProfile(p);setContact({hoTen:p.hoTen,email:p.email,soDienThoai:p.soDienThoai||''})}const h=await hotelApi.detail(r.khachSanId);setHotel(h)}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[id])
  const nightCount=useMemo(()=>{const a=new Date(start).getTime(),b=new Date(end).getTime();return a&&b?Math.max(1,Math.ceil((b-a)/86400000)):1},[start,end]);const estimate=(selectedRooms.length?selectedRooms.reduce((sum,r)=>sum+Number(r.giaMoiDem||0),0):Number(room?.giaMoiDem||0)*qty)*nightCount
  useEffect(()=>{if(!room||!hotel)return;let cancelled=false;const serviceIds=[...new Set((physicalRoomSelections.length?physicalRoomSelections.map(x=>x.typeId):[room.id]))];Promise.all(serviceIds.map(serviceId=>promotionApi.available({serviceType:'HOTEL',serviceId,providerId:hotel.nhaCungCapId}).catch(()=>[]))).then(groups=>{if(cancelled)return;const seen=new Set<string>();const eligible=groups.flat().filter((p:any)=>{const code=String(p.code||'');if(!code||seen.has(code)||Number(p.minOrderAmount||0)>estimate)return false;seen.add(code);return true});setPromotions(eligible);setPromotionCode(current=>eligible.some((p:any)=>p.code===current)?current:'')});return()=>{cancelled=true}},[room,hotel,estimate])
  const chosen=promotions.find((p:any)=>p.code===promotionCode)
  const discount=chosen?(chosen.discountType==='PERCENTAGE'?Math.min(estimate*Number(chosen.discountValue||0)/100,Number(chosen.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Number(chosen.discountValue||0)):0
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!room||!hotel)return;if(!start||!end){setError('Vui lòng chọn ngày nhận và trả phòng.');return}if(!contact.hoTen||!contact.email||!contact.soDienThoai){setError('Vui lòng nhập đầy đủ thông tin người đặt phòng.');return}if(physicalRoomIds.some(x=>!Number.isSafeInteger(x)||x<=0)||new Set(physicalRoomIds).size!==physicalRoomIds.length|| (physicalRoomIds.length>0&&selectedRooms.length!==physicalRoomIds.length)){setError('Danh sách phòng cụ thể đã chọn không hợp lệ.');return}setBusy(true);setError('');try{const booking=await bookingApi.create({idempotencyKey:crypto.randomUUID(),promotionCode:promotionCode.trim()||undefined,danhSachDichVu:(physicalRoomSelections.length?physicalRoomSelections:[null]).map(selection=>({loaiDichVu:'HOTEL' as const,dichVuId:selection?.typeId??room.id,soLuong:selection===null?qty:1,ngayBatDau:start,ngayKetThuc:end,thongTinBoSung:JSON.stringify({loaiDatVe:'HOTEL',hotelId:hotel.id,phongCuTheId:selection?.roomId??null,contact,requests,profileId:profile?.id||session?.id||null})}))});navigate(`/payments/new?bookingId=${booking.id}`)}catch(err){setError(bookingPromotionError(err,promotionCode,()=>setPromotionCode('')))}finally{setBusy(false)}}
  if(loading)return <div className="container pad"><Loading label="Đang tải thông tin phòng..."/></div>;if(error&&!room)return <div className="container pad"><ErrorState message={error}/></div>;if(!room||!hotel)return <div className="container pad"><ErrorState message="Không tìm thấy phòng khách sạn."/></div>
  return <div className="travel-booking-page-v2 hotel-booking-page-v2"><div className="container travel-booking-wrap-v2"><div className="travel-breadcrumb-v2">Trang chủ <span>›</span> Khách sạn <span>›</span> {hotel.tenKhachSan} <span>›</span> Thông tin khách</div><div className="travel-booking-banner-v2"><div><h1>{hotel.tenKhachSan}</h1><p><MapPin/>{hotel.diaChi}, {hotel.thanhPho}</p></div></div><div className="travel-booking-stepper-v2"><div className="done"><b>✓</b><span>Chọn phòng</span></div><i/><div className="active"><b>2</b><span>Thông tin khách</span></div><i/><div><b>3</b><span>Thanh toán</span></div><i/><div><b>4</b><span>Xác nhận</span></div></div><div className="travel-booking-layout-v2"><form onSubmit={submit}>
    {error&&<div className="form-alert">{error}</div>}
    <section className="travel-form-card-v2"><h2><b>1</b> Thông tin người nhận</h2><div className="travel-form-grid-v2 three"><label>Họ và tên *<input value={contact.hoTen} onChange={e=>setContact({...contact,hoTen:e.target.value})}/></label><label>Số điện thoại *<input value={contact.soDienThoai} onChange={e=>setContact({...contact,soDienThoai:e.target.value})}/></label><label>Email *<input type="email" value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></label></div></section>
    <section className="travel-form-card-v2"><h2><b>2</b> Yêu cầu đặc biệt <small>(tùy chọn)</small></h2><div className="travel-request-pills-v2"><label><input type="checkbox" checked={requests.tangCao} onChange={e=>setRequests({...requests,tangCao:e.target.checked})}/>Phòng tầng cao</label><label><input type="checkbox" checked={requests.giuongDoi} onChange={e=>setRequests({...requests,giuongDoi:e.target.checked})}/>Giường đôi</label><label><input type="checkbox" checked={requests.khongHutThuoc} onChange={e=>setRequests({...requests,khongHutThuoc:e.target.checked})}/>Phòng không hút thuốc</label></div><textarea rows={3} placeholder="Nhập yêu cầu khác..." value={requests.khac} onChange={e=>setRequests({...requests,khac:e.target.value})}/></section>
    <section className="travel-form-card-v2 promotion-code-v2"><h2>Ưu đãi</h2><label>Ưu đãi áp dụng<select value={promotionCode} onChange={e=>setPromotionCode(e.target.value)}><option value="">Không áp dụng ưu đãi</option>{promotions.map((p:any)=><option key={p.id} value={p.code}>{p.name} — {p.code}</option>)}</select></label>{promotions.length===0&&<span className="promotion-empty-v2">Hiện không có ưu đãi đủ điều kiện cho đơn {money(estimate)}.</span>}</section>
    <div className="travel-booking-actions-v2"><Link to={`/hotels/${hotel.id}?checkIn=${start}&checkOut=${end}&guests=${guestCount}`}><ArrowLeft/>Quay lại</Link><button disabled={busy}>{busy?'Đang tạo Booking...':'Tiếp tục thanh toán'}<ArrowRight/></button></div>
  </form><aside><section className="travel-order-card-v2"><h3>Thông tin đặt phòng</h3><div className="travel-order-title-v2"><BedDouble/><div><b>{hotel.tenKhachSan}</b><span>{room.tenLoaiPhong}</span></div></div><p><span>Nhận phòng</span><b>{start||'—'}</b></p><p><span>Trả phòng</span><b>{end||'—'}</b></p><p><span>Số đêm</span><b>{nightCount} đêm</b></p><p><span>Số phòng</span><b>{qty} phòng</b></p>{physicalRoomIds.length>0&&<p><span>Mã phòng đã chọn</span><b>{physicalRoomIds.join(", ")}</b></p>}<p><span>Số khách</span><b>{guestCount} khách</b></p><div className="travel-price-lines-v2"><p><span>Giá phòng tạm tính</span><b>{money(estimate)}</b></p>{chosen&&<p><span>Ưu đãi ({promotionCode})</span><b>-{money(discount)}</b></p>}<p className="total"><span>Tổng thanh toán dự kiến</span><b>{money(Math.max(0,estimate-discount))}</b></p></div><small>Giá cuối cùng do Booking Service lấy lại từ Hotel Service; ưu đãi do Promotion Service tính.</small></section><section className="travel-trust-card-v2"><ShieldCheck/><div><b>Cam kết giá tốt nhất</b><span>Không tự tính giảm giá ở frontend</span></div></section></aside></div></div></div>
}

function AttractionBookingCreate(){
  const [sp]=useSearchParams();const navigate=useNavigate();const {session}=useAuth();const id=Number(sp.get('id'));const qty=Math.max(1,Number(sp.get('qty')||1));const requestedStart=sp.get('start')||'';const selectedTicketItems=useMemo(()=>{try{const parsed=JSON.parse(sp.get('tickets')||'[]');return Array.isArray(parsed)?parsed.filter((v:any)=>Number.isSafeInteger(v.id)&&Number.isSafeInteger(v.qty)&&v.qty>0):[]}catch{return []}},[sp])
  const [ticket,setTicket]=useState<TicketType|null>(null);const [allTickets,setAllTickets]=useState<TicketType[]>([]);const [attraction,setAttraction]=useState<Attraction|null>(null);const [profile,setProfile]=useState<Profile|null>(null);const [contact,setContact]=useState({hoTen:session?.hoTen||'',soDienThoai:'',email:session?.email||''});const [note,setNote]=useState('');const [promotionCode,setPromotionCode]=useState('');const [promotions,setPromotions]=useState<any[]>([]);const [startDate,setStartDate]=useState(requestedStart);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{Promise.all([attractionApi.ticket(id),authApi.profile().catch(()=>null)]).then(async([t,p])=>{setTicket(t);if(p){setProfile(p);setContact({hoTen:p.hoTen,email:p.email,soDienThoai:p.soDienThoai||''})}const a=await attractionApi.detail(t.diaDiemId);setAttraction(a);const related=await Promise.all(selectedTicketItems.length?selectedTicketItems.map((item:any)=>attractionApi.ticket(item.id)): [Promise.resolve(t)]);setAllTickets(related);const total=selectedTicketItems.length?related.reduce((sum,item)=>sum+Number(item.giaVe||0)*(selectedTicketItems.find((x:any)=>x.id===item.id)?.qty||0),0):Number(t.giaVe||0)*qty;const ps=await promotionApi.available({serviceType:'ATTRACTION',serviceId:t.id,providerId:a.nhaCungCapId}).catch(()=>[]);const eligible=ps.filter((x:any)=>Number(x.minOrderAmount||0)<=total);setPromotions(eligible);if(eligible.length){const best=[...eligible].sort((x:any,y:any)=>{const dx=x.discountType==='PERCENTAGE'?Math.min(total*Number(x.discountValue||0)/100,Number(x.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Number(x.discountValue||0);const dy=y.discountType==='PERCENTAGE'?Math.min(total*Number(y.discountValue||0)/100,Number(y.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Number(y.discountValue||0);return dy-dx})[0];setPromotionCode(best.code)}else setPromotionCode('');const min=t.ngayBatDau||'';const max=t.ngayKetThuc||'';if(!requestedStart||requestedStart<min||requestedStart>max)setStartDate(min)}).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))},[id,qty,requestedStart])
  const estimate=selectedTicketItems.length?allTickets.reduce((sum,item)=>sum+Number(item.giaVe||0)*(selectedTicketItems.find((x:any)=>x.id===item.id)?.qty||0),0):Number(ticket?.giaVe||0)*qty
  const chosen=promotions.find((p:any)=>p.code===promotionCode)
  const discount=chosen?(chosen.discountType==='PERCENTAGE'?Math.min(estimate*Number(chosen.discountValue||0)/100,Number(chosen.maxDiscountAmount||Number.MAX_SAFE_INTEGER)):Number(chosen.discountValue||0)):0
  const finalTotal=Math.max(0,estimate-Math.min(estimate,discount))
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!ticket||!attraction)return;if(!startDate){setError('Vui lòng chọn ngày tham quan.');return}if(ticket.ngayBatDau&&startDate<ticket.ngayBatDau){setError(`Ngày tham quan phải từ ${date(ticket.ngayBatDau)}.`);return}if(ticket.ngayKetThuc&&startDate>ticket.ngayKetThuc){setError(`Ngày tham quan không được sau ${date(ticket.ngayKetThuc)}.`);return}if(!contact.hoTen||!contact.email||!contact.soDienThoai){setError('Tài khoản chưa có đủ họ tên, email hoặc số điện thoại. Vui lòng cập nhật hồ sơ.');return}setBusy(true);setError('');try{const booking=await bookingApi.create({idempotencyKey:crypto.randomUUID(),promotionCode:promotionCode||undefined,danhSachDichVu:(selectedTicketItems.length?selectedTicketItems:[{id:ticket.id,qty}]).map((item:any)=>({loaiDichVu:'ATTRACTION' as const,dichVuId:item.id,soLuong:item.qty,ngayBatDau:startDate,thongTinBoSung:JSON.stringify({loaiDatVe:'ATTRACTION',attractionId:attraction.id,contact,note,profileId:profile?.id||session?.id||null})}))});navigate(`/payments/new?bookingId=${booking.id}`)}catch(err){setError(bookingPromotionError(err,promotionCode,()=>setPromotionCode('')))}finally{setBusy(false)}}
  if(loading)return <div className="container pad"><Loading label="Đang tải thông tin vé..."/></div>;if(error&&!ticket)return <div className="container pad"><ErrorState message={error}/></div>;if(!ticket||!attraction)return <div className="container pad"><ErrorState message="Không tìm thấy vé tham quan."/></div>
  return <div className="travel-booking-page-v2 attraction-booking-page-v2"><div className="container travel-booking-wrap-v2"><div className="travel-breadcrumb-v2">Trang chủ <span>›</span> Địa điểm tham quan <span>›</span> {attraction.tenDiaDiem} <span>›</span> Đặt vé</div><div className="travel-booking-banner-v2"><div><h1>{attraction.tenDiaDiem}</h1><p><MapPin/>{[attraction.diaChi, attraction.quanHuyen, attraction.thanhPho].filter(Boolean).join(', ')}</p></div></div><div className="travel-booking-stepper-v2"><div className="done"><b>✓</b><span>Chọn vé</span></div><i/><div className="active"><b>2</b><span>Thông tin khách hàng</span></div><i/><div><b>3</b><span>Thanh toán</span></div><i/><div><b>4</b><span>Xác nhận</span></div></div><div className="travel-booking-layout-v2"><form onSubmit={submit}>{error&&<div className="form-alert">{error}</div>}<section className="travel-form-card-v2"><h2>Thông tin khách hàng</h2><p className="travel-info-strip-v2">Thông tin được lấy từ tài khoản đang đăng nhập.</p><div className="travel-form-grid-v2 two"><label>Họ và tên<input readOnly value={contact.hoTen}/></label><label>Số điện thoại<input readOnly value={contact.soDienThoai}/></label><label className="full">Email<input readOnly value={contact.email}/></label></div></section><section className="travel-form-card-v2"><h2>Ngày tham quan</h2><div className="travel-form-grid-v2 two"><label>Ngày sử dụng *<input type="date" min={ticket.ngayBatDau||undefined} max={ticket.ngayKetThuc||undefined} value={startDate} onChange={e=>setStartDate(e.target.value)}/><small>Vé có hiệu lực từ {ticket.ngayBatDau?date(ticket.ngayBatDau):'—'} đến {ticket.ngayKetThuc?date(ticket.ngayKetThuc):'—'}.</small></label></div></section><section className="travel-form-card-v2"><h2>Yêu cầu đặc biệt <small>(nếu có)</small></h2><textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ví dụ: xe lăn, hỗ trợ người cao tuổi, ghi chú khác..."/></section><section className="travel-form-card-v2 promotion-code-v2"><h2>Ưu đãi</h2><label>Ưu đãi áp dụng<select value={promotionCode} onChange={e=>setPromotionCode(e.target.value)}><option value="">Không áp dụng ưu đãi</option>{promotions.map((p:any)=><option key={p.id} value={p.code}>{p.name} — {p.code}</option>)}</select></label>{promotions.length===0&&<span className="promotion-empty-v2">Hiện không có ưu đãi đủ điều kiện cho đơn {money(estimate)}.</span>}</section><div className="travel-booking-actions-v2"><Link to={`/attractions/${attraction.id}?date=${startDate}&qty=${qty}`}><ArrowLeft/>Quay lại</Link><button disabled={busy}>{busy?'Đang tạo Booking...':'Tiếp tục thanh toán'}<ArrowRight/></button></div></form><aside><section className="travel-order-card-v2"><h3>Thông tin đơn hàng</h3><div className="travel-order-title-v2"><Ticket/><div><b>{attraction.tenDiaDiem}</b><span>{ticket.tenLoaiVe}{ticket.doiTuongApDung ? ` · ${ticket.doiTuongApDung}` : ''}</span></div></div><p><span>Ngày tham quan</span><b>{startDate||'—'}</b></p><p><span>Số lượng</span><b>{selectedTicketItems.length?selectedTicketItems.reduce((sum:any,item:any)=>sum+item.qty,0):qty} vé</b></p>{selectedTicketItems.length?allTickets.map(item=><p key={item.id}><span>{item.tenLoaiVe} × {selectedTicketItems.find((x:any)=>x.id===item.id)?.qty||0}</span><b>{money(Number(item.giaVe)*(selectedTicketItems.find((x:any)=>x.id===item.id)?.qty||0))}</b></p>):<p><span>Giá vé</span><b>{money(Number(ticket.giaVe))}</b></p>}<div className="travel-price-lines-v2"><p><span>Tạm tính</span><b>{money(estimate)}</b></p>{chosen&&<><p><span>Ưu đãi ({promotionCode})</span><b>-{money(discount)}</b></p><p className="total"><span>Tổng thanh toán</span><b>{money(finalTotal)}</b></p></>} {!chosen&&<p className="total"><span>Tổng thanh toán</span><b>{money(estimate)}</b></p>}</div><small>Giá và ưu đãi sẽ được backend kiểm tra lại trước khi xác nhận đơn.</small></section><section className="travel-trust-card-v2"><ShieldCheck/><div><b>Thanh toán an toàn</b><span>Thông tin thanh toán được bảo vệ và xác nhận trước khi hoàn tất.</span></div></section></aside></div></div></div>
}
