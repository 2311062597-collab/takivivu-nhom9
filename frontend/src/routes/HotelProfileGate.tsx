import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hotelApi } from '../api/services'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from '../components/UI'

export default function HotelProfileGate({children}:{children:ReactNode}) {
  const { session } = useAuth()
  const location = useLocation()
  const [state, setState] = useState<'loading' | 'complete' | 'incomplete' | 'error'>('loading')
  useEffect(() => {
    if (session?.loaiNhaCungCap !== 'HOTEL') return
    let alive = true
    setState('loading')
    hotelApi.mine().then(hotels => {
      if (!alive) return
      const h = hotels[0]
      setState(h && h.soTang > 0 && !!h.tenKhachSan?.trim() && !!h.moTa?.trim() && !!h.diaChi?.trim() && !!h.thanhPho?.trim() && !!h.quanHuyen?.trim() && !!h.soDienThoai?.trim() && !!h.email?.trim() && !!h.hinhAnh?.trim() && !!h.anhGioiThieu?.trim() && !!h.tienNghi?.trim() ? 'complete' : 'incomplete')
    }).catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [session?.id, session?.loaiNhaCungCap, location.pathname])
  if (session?.loaiNhaCungCap !== 'HOTEL') return <>{children}</>
  if (location.pathname === '/provider/profile' || location.pathname === '/provider') return <>{children}</>
  if (state === 'loading') return <Loading label="Đang kiểm tra hồ sơ khách sạn..." />
  if (state === 'error') return <div role="alert">Không kiểm tra được hồ sơ khách sạn. Vui lòng tải lại trang.</div>
  if (state === 'incomplete') return <Navigate to="/provider/profile" replace />
  return <>{children}</>
}
