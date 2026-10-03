import { ArrowLeftRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, MapPin, Plane, Search, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { flightApi } from '../../api/services'
import type { Flight } from '../../types'
import { apiError, money } from '../../utils/format'
import { EmptyState, ErrorState, Loading } from '../../components/UI'

const PAGE_SIZE = 4

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function durationLabel(start: string, end: string) {
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h ? `${h}h` : ''}${m ? ` ${m}m` : ''}`.trim() || '—'
}

function airlineTone(name: string) {
  const n = name.toLowerCase()
  if (n.includes('vietjet')) return 'vietjet'
  if (n.includes('bamboo')) return 'bamboo'
  if (n.includes('pacific')) return 'pacific'
  if (n.includes('vietnam')) return 'vietnam'
  return 'default'
}

export default function FlightsPage() {
  const [sp, setSp] = useSearchParams()
  const [form, setForm] = useState({
    diemDi: sp.get('diemDi') || 'Hà Nội',
    diemDen: sp.get('diemDen') || 'Đà Nẵng',
    ngayKhoiHanh: sp.get('ngayKhoiHanh') || '',
    passengers: Math.max(1, Number(sp.get('passengers') || 1)),
  })
  const [data, setData] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<'price' | 'time'>('price')
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(Number.MAX_SAFE_INTEGER)
  const [timeBands, setTimeBands] = useState<string[]>([])
  const [durationBands, setDurationBands] = useState<string[]>([])
  const [showDuration, setShowDuration] = useState(false)
  const [page, setPage] = useState(1)
  const [hasLoadedFlights, setHasLoadedFlights] = useState(false)
  const [viewingAll, setViewingAll] = useState(false)

  const run = async (criteria = form) => {
    if (!criteria.diemDi || !criteria.diemDen || !criteria.ngayKhoiHanh) return
    setLoading(true)
    setError('')
    setHasLoadedFlights(true)
    setViewingAll(false)
    try {
      const result = await flightApi.search({
        diemDi: criteria.diemDi,
        diemDen: criteria.diemDen,
        ngayKhoiHanh: criteria.ngayKhoiHanh,
      })
      const available = result.filter(item => item.soGheConLai >= criteria.passengers && item.trangThai === 'SCHEDULED')
      setData(available)
      setSelectedAirlines([])
      setPage(1)
      setMaxPrice(Number.MAX_SAFE_INTEGER)
    } catch (e) {
      setError(apiError(e))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (form.diemDi && form.diemDen && form.ngayKhoiHanh) {
      void run(form)
    } else {
      void showAllFlights()
    }
    // only initial load / URL search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const airlines = useMemo(() => Array.from(new Set(data.map(item => item.hangHangKhong))).sort(), [data])
  const priceCeiling = useMemo(() => Math.max(100_000, Math.ceil(Math.max(0, ...data.map(item => Number(item.giaVe) || 0)) / 100_000) * 100_000), [data])

  const filtered = useMemo(() => {
    const inBand = (hour: number) => {
      if (!timeBands.length) return true
      return timeBands.some(band => band === 'morning' ? hour < 12 : band === 'afternoon' ? hour < 18 && hour >= 12 : hour >= 18)
    }
    return data
      .filter(item => !selectedAirlines.length || selectedAirlines.includes(item.hangHangKhong))
      .filter(item => Number(item.giaVe) <= maxPrice)
      .filter(item => inBand(new Date(item.thoiGianKhoiHanh).getHours()))
      .filter(item => {
        if (!durationBands.length) return true
        const minutes = Math.max(0, (new Date(item.thoiGianDen).getTime() - new Date(item.thoiGianKhoiHanh).getTime()) / 60000)
        return durationBands.some(band => band === 'short' ? minutes < 120 : band === 'medium' ? minutes >= 120 && minutes <= 240 : minutes > 240)
      })
      .sort((a, b) => sort === 'time'
        ? new Date(a.thoiGianKhoiHanh).getTime() - new Date(b.thoiGianKhoiHanh).getTime()
        : Number(a.giaVe) - Number(b.giaVe))
  }, [data, selectedAirlines, maxPrice, timeBands, durationBands, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const showAllFlights = async () => {
    setLoading(true); setError(''); setHasLoadedFlights(true); setViewingAll(true)
    try {
      const result = await flightApi.catalog()
      setData(result.filter(item => item.trangThai === 'SCHEDULED' && item.soGheConLai >= form.passengers))
      setSelectedAirlines([]); setTimeBands([]); setDurationBands([]); setMaxPrice(Number.MAX_SAFE_INTEGER); setPage(1)
      setSp({})
    } catch (e) { setError(apiError(e)); setData([]) } finally { setLoading(false) }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = {
      diemDi: form.diemDi.trim(),
      diemDen: form.diemDen.trim(),
      ngayKhoiHanh: form.ngayKhoiHanh,
      passengers: String(form.passengers),
    }
    setSp(next)
    void run(form)
  }

  const swap = () => {
    setForm(current => ({ ...current, diemDi: current.diemDen, diemDen: current.diemDi }))
    // Chỉ đổi giá trị hai ô; người dùng nhấn Tìm chuyến bay để tìm lại.
  }
  const toggleAirline = (airline: string) => setSelectedAirlines(current => current.includes(airline) ? current.filter(value => value !== airline) : [...current, airline])
  const toggleBand = (band: string) => setTimeBands(current => current.includes(band) ? current.filter(value => value !== band) : [...current, band])
  const toggleDuration = (band: string) => setDurationBands(current => current.includes(band) ? current.filter(value => value !== band) : [...current, band])

  return <div className="flight-ref-page">
    <section className="flight-ref-hero">
      <div className="container flight-ref-hero-inner">
        <div className="flight-ref-breadcrumb">Trang chủ <span>›</span> Chuyến bay</div>
        <div className="flight-ref-copy"><h1>Tìm chuyến bay phù hợp</h1><p>Hàng trăm chuyến bay do các nhà cung cấp đăng tải, tìm đúng hành trình với mức giá minh bạch.</p></div>
        <div className="flight-ref-script">Bay xa hơn<br/>đến những hành trình mới <Plane/></div>
        <form className="flight-ref-search" onSubmit={submit}>
          
          <div className="flight-search-grid is-oneway">
            <label><span>Nơi đi</span><div><MapPin/><input required value={form.diemDi} onChange={e => setForm({ ...form, diemDi: e.target.value })} placeholder="Nhập nơi đi"/></div></label>
            <button className="flight-swap" type="button" aria-label="Đảo chiều nơi đi và nơi đến" title="Đảo chiều nơi đi và nơi đến" onClick={swap}><ArrowLeftRight/></button>
            <label><span>Nơi đến</span><div><MapPin/><input required value={form.diemDen} onChange={e => setForm({ ...form, diemDen: e.target.value })} placeholder="Nhập nơi đến"/></div></label>
            <label><span>Ngày đi</span><div><CalendarDays/><input required type="date" value={form.ngayKhoiHanh} onChange={e => setForm({ ...form, ngayKhoiHanh: e.target.value })}/></div></label>
            <label><span>Hành khách</span><div><UsersRound/><input type="number" min={1} max={9} value={form.passengers} onChange={e => setForm({ ...form, passengers: Math.max(1, Number(e.target.value)) })}/><small>người</small></div></label>
            <button className="flight-search-button"><Search/>Tìm chuyến bay</button>
          </div>
        </form>
      </div>
    </section>

    <div className="container flight-ref-content">
      <aside className="flight-ref-filters">
        <div className="filter-heading"><strong>Bộ lọc</strong><button type="button" onClick={() => { setSelectedAirlines([]); setTimeBands([]); setDurationBands([]); setMaxPrice(priceCeiling) }}>Xóa tất cả</button></div>
        <div className="filter-block"><h3>Hãng hàng không</h3>{airlines.length ? airlines.map(airline => <label className="check-row" key={airline}><input type="checkbox" checked={selectedAirlines.includes(airline)} onChange={() => toggleAirline(airline)}/><span className={`airline-dot ${airlineTone(airline)}`}/><span>{airline}</span><small>({data.filter(item => item.hangHangKhong === airline).length})</small></label>) : <p className="filter-empty">Hãng bay sẽ xuất hiện sau khi tìm kiếm.</p>}</div>
        <div className="filter-block"><h3>Khoảng giá (VND)</h3><input className="flight-price-range" type="range" min={0} max={priceCeiling} step={100000} value={Math.min(maxPrice, priceCeiling)} onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1) }}/><div className="range-label"><span>0</span><span>{money(Math.min(maxPrice, priceCeiling))}</span></div></div>
        <div className="filter-block"><h3>Giờ khởi hành (chiều đi)</h3><label className="check-row"><input type="checkbox" checked={timeBands.includes('morning')} onChange={() => toggleBand('morning')}/><span>Sáng (00:00 - 12:00)</span></label><label className="check-row"><input type="checkbox" checked={timeBands.includes('afternoon')} onChange={() => toggleBand('afternoon')}/><span>Chiều (12:00 - 18:00)</span></label><label className="check-row"><input type="checkbox" checked={timeBands.includes('night')} onChange={() => toggleBand('night')}/><span>Tối (18:00 - 24:00)</span></label></div>
        <button type="button" className="filter-collapsed" onClick={() => setShowDuration(v => !v)}><span>Thời gian bay</span><ChevronRight/></button>{showDuration && <div className="filter-block"><label className="check-row"><input type="checkbox" checked={durationBands.includes('short')} onChange={() => toggleDuration('short')}/><span>Dưới 2 giờ</span></label><label className="check-row"><input type="checkbox" checked={durationBands.includes('medium')} onChange={() => toggleDuration('medium')}/><span>2 - 4 giờ</span></label><label className="check-row"><input type="checkbox" checked={durationBands.includes('long')} onChange={() => toggleDuration('long')}/><span>Trên 4 giờ</span></label></div>}
      </aside>

      <section className="flight-ref-results">
        <div className="flight-results-head"><div><h2>{viewingAll ? `Tất cả chuyến bay (${filtered.length})` : form.diemDi && form.diemDen && form.ngayKhoiHanh ? `Tìm thấy ${filtered.length} chuyến bay` : 'Tìm chuyến bay'}</h2><p>Giá hiển thị là giá do nhà cung cấp đăng tải. Booking Service sẽ kiểm tra lại khi tạo đơn.</p></div><div className="flight-results-actions"><button type="button" className="flight-view-all" onClick={() => void showAllFlights()}>Xem tất cả chuyến bay</button><label>Sắp xếp theo<select value={sort} onChange={e => setSort(e.target.value as 'price' | 'time')}><option value="price">Giá thấp nhất</option><option value="time">Khởi hành sớm nhất</option></select></label></div></div>
        {loading ? <Loading/> : error ? <ErrorState message={error} onRetry={() => viewingAll ? void showAllFlights() : void run()}/> : !hasLoadedFlights ? <EmptyState title="Nhập hành trình để tìm chuyến bay" description="Chọn nơi đi, nơi đến và ngày khởi hành ở phía trên."/> : paged.length === 0 ? <EmptyState title="Không tìm thấy chuyến bay" description="Không có chuyến bay còn đủ ghế với bộ lọc hiện tại."/> : <div className="flight-result-list">{paged.map(item => <article className="flight-ref-card" key={item.id}>
          <div className={`airline-badge ${airlineTone(item.hangHangKhong)}`}><Plane/></div>
          <div className="flight-airline"><strong>{item.hangHangKhong}</strong><small>{item.maChuyenBay}</small><Link to={`/flights/${item.id}?passengers=${form.passengers}`}>Chi tiết chuyến bay</Link></div>
          <div className="flight-point"><strong>{timeLabel(item.thoiGianKhoiHanh)}</strong><span>{item.diemDi}</span><small>{item.sanBayDi}</small></div>
          <div className="flight-duration"><span>{durationLabel(item.thoiGianKhoiHanh, item.thoiGianDen)}</span><div><i/><Plane/><i/></div><small>Bay thẳng</small></div>
          <div className="flight-point"><strong>{timeLabel(item.thoiGianDen)}</strong><span>{item.diemDen}</span><small>{item.sanBayDen}</small></div>
          <div className="flight-ref-price"><span>Giá vé từ</span><strong>{money(item.giaVe)}</strong><small>Còn {item.soGheConLai} ghế</small></div>
          <Link className="flight-choose" to={`/flights/${item.id}?passengers=${form.passengers}`}>Chọn</Link>
        </article>)}</div>}
        {hasLoadedFlights && filtered.length > 0 && <div className="flight-pagination"><button disabled={currentPage === 1} onClick={() => setPage(v => Math.max(1, v - 1))}><ChevronLeft/></button>{Array.from({ length: totalPages }, (_, i) => i + 1).map(value => <button className={value === currentPage ? 'active' : ''} key={value} onClick={() => setPage(value)}>{value}</button>)}<button disabled={currentPage === totalPages} onClick={() => setPage(v => Math.min(totalPages, v + 1))}><ChevronRight/></button></div>}
      </section>
    </div>
  </div>
}
