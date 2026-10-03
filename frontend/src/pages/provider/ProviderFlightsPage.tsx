import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { flightApi } from '../../api/services'
import type { Flight, FlightStatus } from '../../types'
import { apiError, money } from '../../utils/format'
import { EmptyState, ErrorState, Loading } from '../../components/UI'

const PER_PAGE = 8

function statusText(status: FlightStatus) {
  if (status === 'SCHEDULED') return 'Đang hoạt động'
  if (status === 'CANCELLED') return 'Đã hủy'
  if (status === 'COMPLETED') return 'Hoàn thành'
  return 'Tạm dừng'
}

function statusClass(status: FlightStatus) {
  if (status === 'SCHEDULED') return 'active'
  if (status === 'CANCELLED') return 'cancelled'
  if (status === 'COMPLETED') return 'completed'
  return 'paused'
}

function dateOnly(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN')
}

function timeOnly(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function airlineMark(name: string) {
  const n = name.toLowerCase()
  if (n.includes('vietjet')) return <span className="airline-mark vietjet">VJ</span>
  if (n.includes('bamboo')) return <span className="airline-mark bamboo">B</span>
  if (n.includes('vietravel')) return <span className="airline-mark vietravel">V</span>
  return <span className="airline-mark vietnam">✦</span>
}

export default function ProviderFlightsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [airline, setAirline] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [remove, setRemove] = useState<Flight | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    flightApi.mine().then(setData).catch(e => setError(apiError(e))).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const airlines = useMemo(() => [...new Set(data.map(x => x.hangHangKhong))], [data])
  const fromAirports = useMemo(() => [...new Set(data.map(x => x.sanBayDi))], [data])
  const toAirports = useMemo(() => [...new Set(data.map(x => x.sanBayDen))], [data])

  const shown = useMemo(() => data.filter(f => {
    const keyword = `${f.maChuyenBay} ${f.hangHangKhong} ${f.diemDi} ${f.diemDen} ${f.sanBayDi} ${f.sanBayDen}`.toLowerCase()
    return (!q || keyword.includes(q.toLowerCase())) && (!airline || f.hangHangKhong === airline) && (!from || f.sanBayDi === from) && (!to || f.sanBayDen === to) && (!status || f.trangThai === status)
  }), [data, q, airline, from, to, status])

  useEffect(() => setPage(1), [q, airline, from, to, status])

  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const currentPage = Math.min(page, pages)
  const paged = shown.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const del = async () => {
    if (!remove) return
    setBusy(true)
    setError('')
    try {
      await flightApi.remove(remove.id)
      setRemove(null)
      load()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  const scheduled = data.filter(x => x.trangThai === 'SCHEDULED').length
  const cancelled = data.filter(x => x.trangThai === 'CANCELLED').length
  const paused = data.filter(x => x.trangThai === 'CLOSED').length

  return (
    <div className="provider-flights-v2">
      <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><span>Quản lý chuyến bay</span><span>›</span><strong>Danh sách chuyến bay</strong></div>
      <section className="provider-v2-page-title-row">
        <div><h1>Quản lý chuyến bay</h1><p>Quản lý danh sách chuyến bay, cập nhật thông tin, giá vé và số ghế.</p></div>
        <button className="provider-v2-primary-btn" onClick={() => navigate('/provider/flights/new')}><Plus /> Thêm chuyến bay</button>
      </section>

      <section className="flight-summary-cards">
        <div className="flight-summary-card blue"><span><Plane /></span><div><small>Tổng chuyến bay</small><strong>{data.length}</strong></div></div>
        <div className="flight-summary-card green"><span>✓</span><div><small>Đang hoạt động</small><strong>{scheduled}</strong></div></div>
        <div className="flight-summary-card orange"><span>◷</span><div><small>Tạm dừng</small><strong>{paused}</strong></div></div>
        <div className="flight-summary-card red"><span>×</span><div><small>Đã hủy</small><strong>{cancelled}</strong></div></div>
      </section>

      <section className="provider-v2-card provider-flight-table-card">
        <div className="flight-filter-bar">
          <div className="flight-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm theo mã chuyến bay, hãng bay, sân bay..."/></div>
          <select value={airline} onChange={e=>setAirline(e.target.value)}><option value="">Hãng bay<br/>Tất cả</option>{airlines.map(x=><option key={x}>{x}</option>)}</select>
          <select value={from} onChange={e=>setFrom(e.target.value)}><option value="">Sân bay đi<br/>Tất cả</option>{fromAirports.map(x=><option key={x}>{x}</option>)}</select>
          <select value={to} onChange={e=>setTo(e.target.value)}><option value="">Sân bay đến<br/>Tất cả</option>{toAirports.map(x=><option key={x}>{x}</option>)}</select>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Trạng thái<br/>Tất cả</option><option value="SCHEDULED">Đang hoạt động</option><option value="CLOSED">Tạm dừng</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option></select>
          <button className="provider-v2-filter-btn"><Filter/>Lọc</button>
        </div>

        {error && <div className="flight-inline-error">{error}</div>}
        {loading ? <Loading /> : error && !data.length ? <ErrorState message={error} onRetry={load}/> : shown.length === 0 ? <EmptyState title="Không tìm thấy chuyến bay"/> : (
          <div className="provider-flight-table-wrap">
            <table className="provider-flight-table">
              <thead><tr><th>#</th><th>Mã chuyến bay</th><th>Hãng bay</th><th>Sân bay đi</th><th>Sân bay đến</th><th>Ngày đi</th><th>Giờ đi</th><th>Giờ đến</th><th>Giá vé (VND)</th><th>Số ghế còn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{paged.map((f,index)=><tr key={f.id}>
                <td>{(currentPage-1)*PER_PAGE+index+1}</td>
                <td className="flight-code">{f.maChuyenBay}</td>
                <td><div className="airline-cell">{airlineMark(f.hangHangKhong)}<span>{f.hangHangKhong}</span></div></td>
                <td><strong>{f.sanBayDi}</strong><small>{f.diemDi}</small></td>
                <td><strong>{f.sanBayDen}</strong><small>{f.diemDen}</small></td>
                <td>{dateOnly(f.thoiGianKhoiHanh)}</td>
                <td>{timeOnly(f.thoiGianKhoiHanh)}</td>
                <td>{timeOnly(f.thoiGianDen)}</td>
                <td className="flight-price-cell">{money(f.giaVe).replace(' ₫','').replace('₫','')}</td>
                <td><strong className={f.soGheConLai===0?'seat-empty':''}>{f.soGheConLai}</strong> / {f.tongSoGhe}</td>
                <td><span className={`flight-status-pill ${statusClass(f.trangThai)}`}>{statusText(f.trangThai)}</span></td>
                <td><div className="provider-flight-actions"><button title="Xem sơ đồ ghế" onClick={()=>navigate(`/provider/flights/${f.id}/seats`)}><Eye/></button><button title="Sửa" onClick={()=>navigate(`/provider/flights/${f.id}/edit`)}><Edit3/></button><button title="Xóa" className="delete" onClick={()=>setRemove(f)}><Trash2/></button><button title="Khác"><MoreHorizontal/></button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}

        <div className="provider-flight-pagination">
          <span>Hiển thị {shown.length ? (currentPage-1)*PER_PAGE+1 : 0} - {Math.min(currentPage*PER_PAGE, shown.length)} của {shown.length} chuyến bay</span>
          <div>
            <button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft/></button>
            {Array.from({length:Math.min(pages,4)},(_,i)=>i+1).map(p=><button key={p} className={p===currentPage?'active':''} onClick={()=>setPage(p)}>{p}</button>)}
            <button disabled={currentPage===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}><ChevronRight/></button>
            <select value={PER_PAGE} disabled><option>{PER_PAGE} / trang</option></select>
          </div>
        </div>
      </section>

      {remove && (
        <div className="flight-delete-backdrop" onMouseDown={()=>!busy&&setRemove(null)}>
          <div className="flight-delete-modal" onMouseDown={e=>e.stopPropagation()}>
            <div className="flight-delete-head"><span><Trash2/></span><h3>Xóa chuyến bay</h3><button disabled={busy} onClick={()=>setRemove(null)}><X/></button></div>
            <p>Bạn có chắc chắn muốn xóa chuyến bay <strong>{remove.maChuyenBay}</strong>?</p>
            <small>Chuyến bay này sẽ được chuyển sang trạng thái không còn hoạt động và không hiển thị cho khách hàng.</small>
            <div className="flight-delete-actions"><button className="cancel" disabled={busy} onClick={()=>setRemove(null)}>Hủy</button><button className="confirm" disabled={busy} onClick={()=>void del()}>{busy?'Đang xóa...':'Xóa chuyến bay'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
