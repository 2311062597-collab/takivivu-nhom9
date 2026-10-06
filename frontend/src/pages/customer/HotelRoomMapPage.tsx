import {useEffect,useMemo,useState} from 'react'
import {Link,useParams,useSearchParams} from 'react-router-dom'
import {CalendarDays,MapPin} from 'lucide-react'
import {hotelApi,type PhysicalRoomInventory} from '../../api/services'
import type {Hotel} from '../../types'
import {apiError,money} from '../../utils/format'
import {ErrorState,Loading} from '../../components/UI'
import './hotelRoomSelection.css'

export default function HotelRoomMapPage(){
 const {id}=useParams();const [sp,setSp]=useSearchParams();const query=sp.toString();
 const start=sp.get('checkIn')||'',end=sp.get('checkOut')||'',guests=sp.get('guests')||'2';
 const updateSearch=(key:string,value:string)=>{const next=new URLSearchParams(sp);if(value)next.set(key,value);else next.delete(key);setSp(next,{replace:true})};
 const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const validDates=!!start&&!!end&&start>=today&&end>start;
 const nights=validDates?Math.ceil((new Date(end).getTime()-new Date(start).getTime())/86400000):0;
 const [hotel,setHotel]=useState<Hotel|null>(null),[inventory,setInventory]=useState<PhysicalRoomInventory[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [floor,setFloor]=useState<number|null>(null),[typeFilter,setTypeFilter]=useState(Number(sp.get('roomTypeId')||0)),[statusFilter,setStatusFilter]=useState('ALL'),[chosen,setChosen]=useState<PhysicalRoomInventory[]>([]);
 useEffect(()=>{let active=true;setLoading(true);setError('');setChosen([]);Promise.all([hotelApi.detail(Number(id),validDates?start:undefined,validDates?end:undefined,Number(guests)),hotelApi.physicalInventory(Number(id),validDates?start:undefined,validDates?end:undefined)]).then(([h,rooms])=>{if(active){setHotel(h);setInventory(rooms)}}).catch(e=>{if(active)setError(apiError(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id,start,end,guests,validDates]);
 const floors=useMemo(()=>[...new Set(inventory.map(r=>r.tang))].sort((a,b)=>a-b),[inventory]);const currentFloor=floor!==null&&floors.includes(floor)?floor:floors[0];
 const types=useMemo(()=>[...new Map(inventory.map(r=>[r.loaiPhongId,r.tenLoaiPhong] as const)).entries()],[inventory]);

 const effectiveTypeFilter=typeFilter&&types.some(([typeId])=>typeId===typeFilter)?typeFilter:0;
 const floorRooms=inventory.filter(r=>r.tang===currentFloor);
 const matchingType=floorRooms.filter(r=>!effectiveTypeFilter||r.loaiPhongId===effectiveTypeFilter);
 const visible=matchingType.filter(r=>statusFilter==='ALL'||statusClass(r)===statusFilter).sort((a,b)=>String(a.soPhong).localeCompare(String(b.soPhong),undefined,{numeric:true}));
 const available=(r:PhysicalRoomInventory)=>validDates&&r.trangThai==='AVAILABLE'&&r.coTheDatTheoNgay;
 const toggle=(r:PhysicalRoomInventory)=>{if(!available(r))return;setChosen(old=>old.some(x=>x.id===r.id)?old.filter(x=>x.id!==r.id):[...old,r])};
 const total=chosen.reduce((sum,r)=>sum+Number(r.giaMoiDem)*nights,0);
 const typeIndex=(r:PhysicalRoomInventory)=>Math.max(0,types.findIndex(([key])=>key===r.loaiPhongId))%4;
 const statusClass=(r:PhysicalRoomInventory)=>r.trangThai==='BOOKED'?'BOOKED':(validDates&&r.trangThai==='AVAILABLE'&&!r.coTheDatTheoNgay)?'HELD':r.trangThai==='INACTIVE'?'UNAVAILABLE':!available(r)?'UNAVAILABLE':'AVAILABLE';
 const status=(r:PhysicalRoomInventory)=>({AVAILABLE:'Trống',BOOKED:'Đã đặt',HELD:'Đang giữ',UNAVAILABLE:'Không khả dụng'}[statusClass(r)]);
 const statusCss=(r:PhysicalRoomInventory)=>({AVAILABLE:'free',BOOKED:'booked',HELD:'held',UNAVAILABLE:'unverified'}[statusClass(r)]);
 const floorCount=(f:number)=>inventory.filter(r=>r.tang===f).length;
 const bookingLink=()=>`/booking/new?${new URLSearchParams({type:'HOTEL',id:String(chosen[0].loaiPhongId),physicalRoomIds:chosen.map(r=>`${r.loaiPhongId}:${r.id}`).join(','),qty:String(chosen.length),start,end,guests}).toString()}`;
 if(loading)return <div className="container pad"><Loading/></div>;if(error||!hotel)return <div className="container pad"><ErrorState message={error||'Không tìm thấy khách sạn'}/></div>;
 const hotelPhoto=hotel.hinhAnh||inventory.find(r=>r.hinhAnh)?.hinhAnh||'';
 return <div className="customer-page hr-page hr-map-reference hr-map-v2"><div className="container">
 <div className="hr-crumb"><Link to="/">Trang chủ</Link> › <Link to="/hotels">Khách sạn</Link> › <Link to={`/hotels/${id}?${query}`}>{hotel.tenKhachSan}</Link> › Sơ đồ khách sạn</div>
 <div className="hr-map-topline"><div className="hr-map-hotel-mini">{hotelPhoto&&<img src={hotelPhoto} alt={hotel.tenKhachSan}/>}<div><h2>{hotel.tenKhachSan}</h2><p><span className="hr-stars">{'★'.repeat(Math.min(5,Math.max(0,Number(hotel.soSao)||0)))}</span> &nbsp; {hotel.soSao || 0} sao</p><p><MapPin size={15}/> {hotel.diaChi}, {hotel.thanhPho}</p></div></div><Link className="hr-outline-link" to={`/hotels/${id}?${query}`}>← Quay lại chi tiết khách sạn</Link></div>

 <section className="hr-card hr-map-filter-card"><div><h1>Sơ đồ khách sạn</h1><p>Chọn ngày, loại phòng và trạng thái để xem phòng phù hợp.</p></div><div className="hr-map-filter-grid">
  <label><span>Ngày nhận phòng</span><div className="hr-date-input"><input aria-label="Ngày nhận phòng" type="date" min={today} value={start} onChange={e=>updateSearch('checkIn',e.target.value)}/><CalendarDays size={17}/></div></label>
  <label><span>Ngày trả phòng</span><div className="hr-date-input"><input aria-label="Ngày trả phòng" type="date" min={start>today?start:today} value={end} onChange={e=>updateSearch('checkOut',e.target.value)}/><CalendarDays size={17}/></div></label>
  <label><span>Loại phòng</span><select value={effectiveTypeFilter} onChange={e=>setTypeFilter(Number(e.target.value))}><option value={0}>Tất cả loại phòng</option>{types.map(([typeId,name])=><option value={typeId} key={typeId}>{name}</option>)}</select></label>
  <label><span>Trạng thái</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="AVAILABLE">Trống</option><option value="HELD">Đang giữ</option><option value="BOOKED">Đã đặt</option><option value="UNAVAILABLE">Không khả dụng</option></select></label>
 </div></section>

 <div className="hr-map-workspace"><aside className="hr-card hr-floor-sidebar"><button className={floor===null?'active':''} onClick={()=>setFloor(null)}><span>Tất cả tầng</span><b>{inventory.length}</b></button>{floors.map(f=><button key={f} className={f===currentFloor&&floor!==null?'active':''} onClick={()=>setFloor(f)}><span>Tầng {f}</span><b>{floorCount(f)}</b></button>)}</aside>
 <main className="hr-card hr-map-canvas"><div className="hr-map-canvas-head"><div><h2>Tầng {currentFloor??'—'}</h2><span>{visible.length} phòng</span></div><div className="hr-map-legend"><span><i className="hr-swatch free"/>Trống</span><span><i className="hr-swatch held"/>Đang giữ</span><span><i className="hr-swatch booked"/>Đã đặt</span><span><i className="hr-swatch unverified"/>Không khả dụng</span></div></div>
 {!validDates&&<p className="hr-muted">Vui lòng chọn ngày nhận và trả phòng hợp lệ để xác minh tình trạng phòng.</p>}
 {visible.length===0?<div className="hr-map-empty">Không có phòng phù hợp với bộ lọc hiện tại.</div>:<div className={`hr-responsive-floor room-count-${Math.min(visible.length,6)}`}>
   <div className="hr-room-bank">{visible.slice(0,Math.ceil(visible.length/2)).map(r=><button key={r.id} className={`hr-responsive-room ${statusCss(r)} ${chosen.some(x=>x.id===r.id)?'selected':''}`} disabled={!available(r)} onClick={()=>toggle(r)}><strong>{r.soPhong}</strong><small>{r.tenLoaiPhong}</small><span>{status(r)}</span></button>)}</div>
   <div className="hr-responsive-corridor"><span>Hành lang</span></div>
   {visible.length>1&&<div className="hr-room-bank bottom">{visible.slice(Math.ceil(visible.length/2)).map(r=><button key={r.id} className={`hr-responsive-room ${statusCss(r)} ${chosen.some(x=>x.id===r.id)?'selected':''}`} disabled={!available(r)} onClick={()=>toggle(r)}><strong>{r.soPhong}</strong><small>{r.tenLoaiPhong}</small><span>{status(r)}</span></button>)}</div>}
 </div>}</main></div>

 <section className="hr-card hr-estimate"><div className="hr-estimate-head"><div><h2>Thông tin tạm tính</h2><p>{chosen.length?`Đã chọn ${chosen.length} phòng`:'Chọn một hoặc nhiều phòng trống trên sơ đồ.'}</p></div>{chosen.length>0&&<button onClick={()=>setChosen([])}>Bỏ chọn tất cả</button>}</div>
 {chosen.length>0&&<div className="hr-estimate-table"><div className="hr-estimate-row header"><span>Phòng</span><span>Loại phòng</span><span>Tầng</span><span>Thời gian</span><span>Đơn giá / đêm</span><span>Thành tiền</span><span/></div>{chosen.map(r=><div className="hr-estimate-row" key={r.id}><strong>Phòng {r.soPhong}</strong><span>{r.tenLoaiPhong}</span><span>Tầng {r.tang}</span><span>{nights} đêm</span><span>{money(Number(r.giaMoiDem))}</span><strong>{money(Number(r.giaMoiDem)*nights)}</strong><button aria-label={`Bỏ phòng ${r.soPhong}`} onClick={()=>toggle(r)}>×</button></div>)}</div>}
 <div className="hr-estimate-total"><div><span>Ngày nhận</span><b>{start||'—'}</b></div><div><span>Ngày trả</span><b>{end||'—'}</b></div><div><span>Tổng số phòng</span><b>{chosen.length}</b></div><div className="grand"><span>Tổng tạm tính</span><strong>{money(total)}</strong></div>{chosen.length>0&&validDates?<Link className="hr-primary" to={bookingLink()}>Đặt phòng ngay →</Link>:<button className="hr-primary" disabled>Chọn phòng để tiếp tục</button>}</div>
 </section>
 </div></div>
}
