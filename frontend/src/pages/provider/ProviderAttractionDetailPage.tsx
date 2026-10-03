import { GoogleMapFrame } from '../../components/GoogleMap'
import {
  Accessibility,
  ArrowLeft,
  Bus,
  Camera,
  Car,
  Copy,
  Edit3,
  ExternalLink,
  Map,
  MapPin,
  Star,
  Ticket,
  Trash2,
  Wifi,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { attractionApi } from '../../api/services'
import type { Attraction } from '../../types'
import { Loading } from '../../components/UI'
import { apiError } from '../../utils/format'
import { googleMapEmbed, googleMapExternal } from '../../utils/googleMaps'
import { attractionMetadataKey, loadAttractionExtra } from './ProviderAttractionsPage'

function ScenicFallback({ variant = 0, large = false }: { variant?: number; large?: boolean }) {
  return <div className={`attraction-detail-scenic variant-${variant % 5} ${large ? 'large' : ''}`}><span className="sky"/><span className="water"/><span className="island"><i/><i/><i/></span></div>
}

function AmenityIcon({ name }: { name: string }) {
  if (name.includes('Bãi')) return <Car/>
  if (name.includes('WiFi')) return <Wifi/>
  if (name.includes('chụp')) return <Camera/>
  if (name.includes('khuyết')) return <Accessibility/>
  if (name.includes('công cộng')) return <Bus/>
  return <MapPin/>
}

export default function ProviderAttractionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<Attraction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [imageFailed, setImageFailed] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    attractionApi.detail(Number(id)).then(setItem).catch(e=>setError(apiError(e))).finally(()=>setLoading(false))
  }, [id])

  const extra = useMemo(() => item ? loadAttractionExtra(item) : null, [item])
  const images = useMemo(() => {
    if (!item || !extra) return []
    const base = extra.images.length ? extra.images : (item.hinhAnh ? [item.hinhAnh] : [])
    return base.slice(0,5)
  }, [item, extra])

  const remove = async () => {
    if (!item) return
    setBusy(true)
    setError('')
    try {
      await attractionApi.remove(item.id)
      try { localStorage.removeItem(attractionMetadataKey(item.id)) } catch { /* ignore */ }
      navigate('/provider/attractions')
    } catch (e) {
      setError(apiError(e))
      setRemoveOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading label="Đang tải chi tiết địa điểm..."/>
  if (!item || !extra) return <div className="hotel-inline-error">{error || 'Không tìm thấy địa điểm tham quan.'}</div>

  const lat = Number(item.viDo) || 0
  const lng = Number(item.kinhDo) || 0
  const fullAddress = [item.diaChi, item.quanHuyen, item.thanhPho].filter(Boolean).join(', ')
  const mapUrl = googleMapEmbed(lat, lng, fullAddress)

  return <div className="provider-attraction-detail-page">
    <div className="provider-v2-breadcrumbs"><Link to="/provider">Trang chủ</Link><span>›</span><Link to="/provider/attractions">Quản lý địa điểm tham quan</Link><span>›</span><strong>Chi tiết địa điểm tham quan</strong></div>

    <div className="attraction-detail-back"><button onClick={()=>navigate('/provider/attractions')}><ArrowLeft/> Quay lại danh sách</button></div>

    <section className="attraction-detail-heading">
      <div><div className="attraction-detail-name-row"><h1>{item.tenDiaDiem}</h1><span className={`provider-hotel-status ${item.trangThai==='ACTIVE'?'active':'paused'}`}>{item.trangThai==='ACTIVE'?'Đang hoạt động':'Tạm dừng'}</span></div><p><MapPin/>{item.diaChi}<span>★</span><b>{extra.rating.toFixed(1)}</b><em>({extra.reviews.toLocaleString('vi-VN')} đánh giá)</em></p></div>
      <div><button className="attraction-detail-edit" onClick={()=>navigate(`/provider/attractions/${item.id}/edit`)}><Edit3/> Sửa địa điểm</button><button className="attraction-detail-delete" onClick={()=>setRemoveOpen(true)}><Trash2/> Xóa địa điểm</button></div>
    </section>

    {error && <div className="hotel-inline-error">{error}</div>}

    <div className="attraction-detail-grid">
      <div className="attraction-detail-left">
        <section className="attraction-detail-gallery">
          <div className="attraction-detail-main-image">{images[0] && !imageFailed[0] ? <img src={images[0]} alt={item.tenDiaDiem} onError={()=>setImageFailed(v=>({...v,0:true}))}/> : <ScenicFallback variant={item.id} large/>}<button className="prev">‹</button><button className="next">›</button></div>
          <div className="attraction-detail-side-images">{[1,2,3].map((index,position)=><div key={index}>{images[index] && !imageFailed[index] ? <img src={images[index]} alt="" onError={()=>setImageFailed(v=>({...v,[index]:true}))}/> : <ScenicFallback variant={item.id+index}/>} {position===2 && Math.max(0,images.length-4)>0 && <span>+{images.length-4}</span>}</div>)}</div>
        </section>

        <section className="attraction-detail-info-card">
          <h3>ⓘ &nbsp; Thông tin chi tiết</h3>
          <div className="attraction-detail-info-list">
            <p><span>Tên địa điểm</span><strong>{item.tenDiaDiem}</strong></p>
            <p><span>Loại địa điểm</span><strong>{extra.category}</strong></p>
            <p className="wide"><span>Mô tả</span><strong>{item.moTa || 'Chưa cập nhật mô tả.'}</strong></p>
            <p><span>Địa chỉ cụ thể</span><strong>{item.diaChi}</strong></p>
            <p><span>Quận/huyện</span><strong>{item.quanHuyen || '—'}</strong></p>
            <p><span>Thành phố/khu vực</span><strong>{item.thanhPho}</strong></p>
            <p><span>Giờ mở cửa</span><strong>{String(item.gioMoCua).slice(0,5)}</strong></p>
            <p><span>Giờ đóng cửa</span><strong>{String(item.gioDongCua).slice(0,5)}</strong></p>
            <p><span>Trạng thái</span><strong><span className={`provider-hotel-status ${item.trangThai==='ACTIVE'?'active':'paused'}`}>{item.trangThai==='ACTIVE'?'Đang hoạt động':'Tạm dừng'}</span></strong></p>
            <p><span>Ngày tạo</span><strong>{extra.createdAt}</strong></p>
            <p><span>Ngày cập nhật</span><strong>{extra.updatedAt}</strong></p>
          </div>
        </section>
      </div>

      <aside className="attraction-detail-right">
        <section className="attraction-detail-map-card">
          <div className="attraction-detail-card-title"><h3><Map/> Vị trí trên bản đồ</h3><a href={googleMapExternal(lat, lng, fullAddress)} target="_blank" rel="noreferrer">Xem trên bản đồ <ExternalLink/></a></div>
          <div className="attraction-detail-map"><GoogleMapFrame title="Bản đồ địa điểm" src={mapUrl}/></div>
          <div className="attraction-coordinate"><MapPin/><span>Tọa độ</span><strong>{lat.toFixed(6)}, {lng.toFixed(6)}</strong><button onClick={()=>navigator.clipboard?.writeText(`${lat}, ${lng}`)}><Copy/></button></div>
        </section>

        <section className="attraction-detail-service-card"><h3>⚙ &nbsp; Tiện ích & dịch vụ</h3><div>{extra.amenities.map(name=><span key={name}><AmenityIcon name={name}/>{name}</span>)}</div></section>

        <section className="attraction-detail-related-card"><h3>● &nbsp; Thông tin liên quan</h3><button onClick={()=>navigate('/provider/tickets')}><Ticket/> Xem các tour sử dụng địa điểm này ({item.danhSachLoaiVe?.length || 0}) <b>›</b></button><button><Star/> Xem đánh giá của khách ({extra.reviews.toLocaleString('vi-VN')}) <b>›</b></button></section>
      </aside>
    </div>

    {removeOpen && <div className="attraction-modal-backdrop" onMouseDown={()=>!busy&&setRemoveOpen(false)}><div className="attraction-delete-modal" onMouseDown={e=>e.stopPropagation()}><button className="attraction-delete-close" onClick={()=>setRemoveOpen(false)}><X/></button><span className="attraction-delete-icon"><Trash2/></span><h3>Xóa địa điểm tham quan</h3><p>Bạn có chắc chắn muốn xóa địa điểm tham quan<br/><strong>“{item.tenDiaDiem}”?</strong></p><div className="attraction-delete-warning"><span>!</span><div><strong>Hành động này không thể hoàn tác.</strong><small>Chỉ xóa được khi địa điểm chưa có loại vé hoặc dữ liệu đặt vé liên quan.</small></div></div><div className="attraction-delete-actions"><button onClick={()=>setRemoveOpen(false)}>Hủy</button><button className="danger" disabled={busy} onClick={()=>void remove()}><Trash2/>{busy?'Đang xóa...':'Xóa địa điểm'}</button></div></div></div>}
  </div>
}
