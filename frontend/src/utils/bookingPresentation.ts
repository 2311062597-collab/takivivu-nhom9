import { attractionApi, flightApi, hotelApi } from '../api/services'
import type { Attraction, BookingItem, Flight, Hotel, Room, TicketType } from '../types'

export type BookingExtra = Record<string, unknown> & {
  contact?: { hoTen?: string; email?: string; soDienThoai?: string }
  passengers?: Array<Record<string, string>>
  guests?: Array<Record<string, string>>
  visitors?: Array<Record<string, string>>
  extras?: Record<string, boolean>
  requests?: Record<string, unknown>
  note?: string
  attractionId?: number
  hotelId?: number
}

export interface BookingPresentation {
  type: BookingItem['loaiDichVu']
  title: string
  subtitle: string
  description: string
  image: string | null
  extra: BookingExtra
  flight?: Flight
  hotel?: Hotel
  room?: Room
  attraction?: Attraction
  ticket?: TicketType
}

export function parseBookingExtra(value?: string | null): BookingExtra {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as BookingExtra : {}
  } catch {
    return {}
  }
}

export async function resolveBookingItem(item: BookingItem): Promise<BookingPresentation> {
  const extra = parseBookingExtra(item.thongTinBoSung)
  if (item.loaiDichVu === 'FLIGHT') {
    const flight = await flightApi.detail(item.dichVuId)
    return {
      type: item.loaiDichVu,
      title: `${flight.hangHangKhong} · ${flight.diemDi} → ${flight.diemDen}`,
      subtitle: `${flight.maChuyenBay} · ${flight.sanBayDi} → ${flight.sanBayDen}`,
      description: `Khởi hành ${new Date(flight.thoiGianKhoiHanh).toLocaleString('vi-VN')}`,
      image: null,
      extra,
      flight,
    }
  }
  if (item.loaiDichVu === 'HOTEL') {
    const room = await hotelApi.room(item.dichVuId)
    const hotel = await hotelApi.detail(room.khachSanId)
    return {
      type: item.loaiDichVu,
      title: hotel.tenKhachSan,
      subtitle: room.tenLoaiPhong,
      description: `${hotel.diaChi}, ${hotel.thanhPho}`,
      image: null,
      extra,
      room,
      hotel,
    }
  }
  const ticket = await attractionApi.ticket(item.dichVuId)
  const attraction = await attractionApi.detail(ticket.diaDiemId)
  return {
    type: item.loaiDichVu,
    title: attraction.tenDiaDiem,
    subtitle: ticket.tenLoaiVe,
    description: `${attraction.diaChi}, ${attraction.thanhPho}`,
    image: attraction.hinhAnh,
    extra,
    attraction,
    ticket,
  }
}

export function bookingStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PAYMENT_RECEIVED: 'Chờ xác nhận thanh toán',
    PAID: 'Đã thanh toán',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành',
    PAYMENT_FAILED: 'Thanh toán thất bại',
    EXPIRED: 'Đã hủy do hết hạn thanh toán',
    CANCELLED: 'Đã hủy',
    CANCEL_REQUESTED: 'Chờ duyệt hủy/hoàn tiền',
    REFUND_PENDING: 'Đang hoàn tiền',
    REFUNDED: 'Đã hoàn tiền',
  }
  return labels[status] || status
}

export function bookingStatusTone(status: string) {
  if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(status)) return 'green'
  if (['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'].includes(status)) return 'red'
  if (['PENDING_PAYMENT', 'PAYMENT_RECEIVED', 'CANCEL_REQUESTED', 'REFUND_PENDING'].includes(status)) return 'amber'
  return 'blue'
}

export function serviceTypeLabel(type: BookingItem['loaiDichVu']) {
  if (type === 'FLIGHT') return 'Chuyến bay'
  if (type === 'HOTEL') return 'Khách sạn'
  return 'Vé tham quan'
}
