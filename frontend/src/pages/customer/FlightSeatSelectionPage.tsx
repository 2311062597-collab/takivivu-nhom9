import { ArrowLeft, ArrowRight, Plane } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { flightApi } from '../../api/services'
import type { Flight, FlightInventory } from '../../types'
import { apiError, money } from '../../utils/format'
import { ErrorState, Loading } from '../../components/UI'

type Seat = FlightInventory['seats'][number]

export default function FlightSeatSelectionPage(){
  const {id}=useParams(); const flightId=Number(id); const [sp]=useSearchParams(); const navigate=useNavigate()
  const initialPassengers=Math.max(1,Math.min(30,Number(sp.get('passengers')||30)))
  const [maxPassengers,setMaxPassengers]=useState(initialPassengers)
  const [flight,setFlight]=useState<Flight|null>(null)
  const [inventory,setInventory]=useState<FlightInventory|null>(null)
  const [selected,setSelected]=useState<Seat[]>([])
  const [fareFilter,setFareFilter]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    setLoading(true)
    Promise.all([flightApi.detail(flightId),flightApi.inventory(flightId)])
      .then(([f,i])=>{setFlight(f);setInventory(i)})
      .catch(e=>setError(apiError(e)))
      .finally(()=>setLoading(false))
  },[flightId])

  const visibleSeats=useMemo(()=>inventory?.seats.filter(s=>!fareFilter||s.hangVe===fareFilter)||[],[inventory,fareFilter])
  const rows=useMemo(()=>{const m=new Map<number,Seat[]>();visibleSeats.forEach(s=>{const n=parseInt(s.maGhe,10);if(!Number.isNaN(n))m.set(n,[...(m.get(n)||[]),s])});return [...m.entries()].sort((a,b)=>a[0]-b[0])},[visibleSeats])
  const summary=useMemo(()=>{
    if(!inventory)return []
    return inventory.fares.map(f=>{
      const seats=selected.filter(s=>s.hangVe===f.hangVe)
      return {hangVe:f.hangVe,soLuong:seats.length,giaVe:Number(f.giaVe),thanhTien:seats.length*Number(f.giaVe)}
    }).filter(x=>x.soLuong>0)
  },[selected,inventory])
  const total=summary.reduce((s,x)=>s+x.thanhTien,0)

  const toggle=(seat:Seat)=>{
    if(seat.trangThai!=='AVAILABLE')return
    setSelected(cur=>{
      if(cur.some(x=>x.id===seat.id))return cur.filter(x=>x.id!==seat.id)
      if(cur.length>=maxPassengers)return cur
      return [...cur,seat]
    })
  }

  if(loading)return <div className="container pad"><Loading label="Đang tải sơ đồ ghế..."/></div>
  if(error||!flight||!inventory)return <div className="container pad"><ErrorState message={error||'Không tải được sơ đồ ghế.'}/></div>

  return <div className="customer-seat-page"><div className="container">
    <div className="customer-seat-heading"><Link to={`/flights/${flight.id}?passengers=${maxPassengers}`}><ArrowLeft/>Quay lại</Link><div><h1>Chọn ghế - {flight.maChuyenBay}</h1><p>{flight.diemDi} ({flight.sanBayDi}) → {flight.diemDen} ({flight.sanBayDen})</p></div></div>
    <div className="customer-seat-layout">
      <aside className="seat-left-panel">
        <section className="seat-side-card"><h2>Hạng vé</h2><label className="seat-count-control"><span>Số ghế muốn chọn (tối đa 30)</span><input aria-label="Số hành khách" type="number" min="1" max="30" value={maxPassengers} onChange={e=>{const n=Math.max(1,Math.min(30,Number(e.target.value)||1));setMaxPassengers(n);setSelected(cur=>cur.slice(0,n))}}/></label><label><input type="radio" checked={!fareFilter} onChange={()=>setFareFilter('')}/>Tất cả hạng vé</label>{inventory.fares.map(f=><label key={f.id}><input type="radio" checked={fareFilter===f.hangVe} onChange={()=>setFareFilter(f.hangVe)}/><span>{f.hangVe}</span><b>{f.soGheConLai} ghế trống</b></label>)}</section>
        <section className="seat-side-card"><h2>Chú thích</h2><div className="seat-legend"><p><i className="available"/>Ghế trống</p><p><i className="selected"/>Ghế đang chọn</p><p><i className="booked"/>Ghế đã đặt/đang giữ</p></div></section>
      </aside>

      <main className="aircraft-card customer-aircraft-card">
        <div className="aircraft-wrap"><div className="aircraft-wing left"/><div className="aircraft-wing right"/><div className="aircraft-body">
          <div className="aircraft-cockpit"><span/><span/></div>
          <div className="aircraft-facilities"><b>🚻</b><b>☕</b></div>
          <div className="seat-columns"><span>A</span><span>B</span><span>C</span><i/><span>D</span><span>E</span><span>F</span></div>
          {rows.map(([row,rs])=><div className="seat-row" key={row}><b>{row}</b>{['A','B','C'].map(c=>{const s=rs.find(x=>x.maGhe===`${row}${c}`);return <SeatButton key={c} seat={s} selected={!!s&&selected.some(x=>x.id===s.id)} onClick={toggle}/>})}<i/>{['D','E','F'].map(c=>{const s=rs.find(x=>x.maGhe===`${row}${c}`);return <SeatButton key={c} seat={s} selected={!!s&&selected.some(x=>x.id===s.id)} onClick={toggle}/>})}</div>)}
          <div className="aircraft-tail-facilities"><b>🚻</b><b>☕</b></div>
          <span className="aircraft-exit exit-left"/><span className="aircraft-exit exit-right"/>
        </div></div>
      </main>

      <aside className="seat-order-panel">
        <section className="seat-side-card"><h2>Thông tin ghế đã chọn</h2>
          <p className="seat-limit">Chọn tối đa <b>{maxPassengers}</b> ghế theo số hành khách. Đã chọn <b>{selected.length}</b>.</p>
          {selected.length===0?<div className="seat-empty">Chọn ghế trên sơ đồ để tiếp tục.</div>:<>
            <div className="seat-selected-chips">{selected.map(s=><button type="button" key={s.id} onClick={()=>toggle(s)}>{s.maGhe}<small>{s.hangVe}</small></button>)}</div>
            <div className="seat-fare-summary">{summary.map(x=><p key={x.hangVe}><span>{x.hangVe} × {x.soLuong}</span><strong>{money(x.thanhTien)}</strong></p>)}</div>
            <div className="seat-total"><span>Tổng cộng</span><strong>{money(total)}</strong></div>
          </>}
          <button className="btn btn-block" disabled={selected.length===0} onClick={()=>navigate(`/booking/new?type=FLIGHT&id=${flight.id}&seats=${encodeURIComponent(selected.map(s=>s.maGhe).join(','))}&passengers=${maxPassengers}`)}>Tiếp tục <ArrowRight/></button>
          <small>Ghế sẽ được Booking Service giữ trong 15 phút sau khi tạo Booking.</small>
        </section>
      </aside>
    </div>
  </div></div>
}

function SeatButton({seat,selected,onClick}:{seat?:Seat;selected:boolean;onClick:(s:Seat)=>void}){
  if(!seat)return <span className="plane-seat missing"/>
  const available=seat.trangThai==='AVAILABLE'
  return <button type="button" aria-label={`Ghế ${seat.maGhe}`} title={`${seat.maGhe} · ${seat.hangVe}`} onClick={()=>onClick(seat)} className={`plane-seat ${available?'available':'booked'} ${selected?'selected':''}`} disabled={!available}>{available?'':'×'}</button>
}
