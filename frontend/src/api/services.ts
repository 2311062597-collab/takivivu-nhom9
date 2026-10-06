import { api } from './client'
import type { PromotionApiResponse, PromotionRequest } from '../data/promotions'
import type { AdminDashboard, AdminUser, AiResponse, Attraction, AttractionRequest, AttractionTicketCategory, Booking, BookingCreateRequest, CustomerRegisterRequest, Flight, FlightInventory, FlightRequest, Hotel, HotelRequest, LoginRequest, LoginResponse, NotificationItem, Payment, PendingProvider, Profile, Role, ProviderRegisterRequest, Room, RoomRequest, TicketRequest, TicketType, UpdateProfileRequest, UserStatus, Refund } from '../types'

export type SystemSetting = { khoa: string; giaTri: string | null; kieuDuLieu: string; nhom: string; moTa: string | null; ngayCapNhat: string | null }

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body).then(r => r.data),
  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, newPassword: string) => api.post<{ message: string }>('/auth/reset-password', { token, newPassword }).then(r => r.data),
  registerCustomer: (body: CustomerRegisterRequest) => api.post('/auth/register/customer', body).then(r => r.data),
  registerProvider: (body: ProviderRegisterRequest) => api.post('/auth/register/provider', body).then(r => r.data),
  uploadProviderLicense: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string; fileName: string }>('/auth/provider-license/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  profile: () => api.get<Profile>('/auth/profile').then(r => r.data),
  updateProfile: (body: UpdateProfileRequest) => api.put<Profile>('/auth/profile', body).then(r => r.data),
  pendingProviders: () => api.get<PendingProvider[]>('/auth/providers/pending').then(r => r.data),
  approveProvider: (id: number) => api.put<PendingProvider>(`/auth/providers/${id}/approve`).then(r => r.data),
  rejectProvider: (id: number, lyDoTuChoi: string) => api.put<PendingProvider>(`/auth/providers/${id}/reject`, { lyDoTuChoi }).then(r => r.data),
  adminDashboard: () => api.get<AdminDashboard>('/auth/admin/dashboard').then(r => r.data),
  adminUsers: (params?: { role?: Role; status?: UserStatus }) => api.get<AdminUser[]>('/auth/admin/users', { params }).then(r => r.data),
  updateUserStatus: (id: number, trangThai: UserStatus) => api.put<AdminUser>(`/auth/admin/users/${id}/status`, { trangThai }).then(r => r.data),
  adminProviders: (status?: 'PENDING' | 'APPROVED' | 'REJECTED') => api.get<PendingProvider[]>('/auth/admin/providers', { params: status ? { status } : undefined }).then(r => r.data),
  adminCustomers: (status?: UserStatus) => api.get<AdminUser[]>('/auth/admin/customers', { params: status ? { status } : undefined }).then(r => r.data),
  updateCustomerStatus: (id: number, trangThai: Exclude<UserStatus, 'PENDING_APPROVAL'>) => api.put<AdminUser>(`/auth/admin/customers/${id}/status`, { trangThai }).then(r => r.data),
  adminSettings: () => api.get<SystemSetting[]>('/auth/admin/settings').then(r => r.data),
  updateAdminSettings: (body: Record<string, string>) => api.put<SystemSetting[]>('/auth/admin/settings', body).then(r => r.data),
}

export const flightApi = {
  catalog: () => api.get<Flight[]>('/flights/catalog').then(r => r.data),
  search: (p: { diemDi: string; diemDen: string; ngayKhoiHanh: string }) => api.get<Flight[]>('/flights/search', { params: p }).then(r => r.data),
  detail: (id: number) => api.get<Flight>(`/flights/${id}`).then(r => r.data),
  inventory: (id: number) => api.get<FlightInventory>(`/flights/${id}/inventory`).then(r => r.data),
  mine: () => api.get<Flight[]>('/flights').then(r => r.data),
  create: (body: FlightRequest) => api.post<Flight>('/flights', body).then(r => r.data),
  update: (id: number, body: FlightRequest) => api.put<Flight>(`/flights/${id}`, body).then(r => r.data),
  remove: (id: number) => api.delete(`/flights/${id}`),
}

export type ProviderRoomType = { id:number; khachSanId:number; tenLoaiPhong:string; moTa:string; dienTich:number; soNguoiLon:number; soTreEm:number; loaiGiuong:string; soLuongGiuong:number; tienNghi:string|null; giaCoBan:number; hinhAnh:string; anhThuVien?:string; dangKinhDoanh:boolean }
export type ProviderPhysicalRoom = { id:number; khachSanId:number; loaiPhongId:number; soPhong:string; tang:number; giaMoiDem:number; dangHoatDong:boolean }
export type ProviderRoomTypeInput = Omit<ProviderRoomType,'id'|'khachSanId'>
export type ProviderPhysicalRoomInput = Pick<ProviderPhysicalRoom,'loaiPhongId'|'soPhong'|'tang'|'dangHoatDong'>
export const providerRoomApi = {
 types:()=>api.get<ProviderRoomType[]>('/hotels/provider/room-types').then(r=>r.data),
 addType:(data:ProviderRoomTypeInput)=>api.post('/hotels/provider/room-types',data).then(r=>r.data),
 editType:(id:number,data:ProviderRoomTypeInput)=>api.put(`/hotels/provider/room-types/${id}`,data).then(r=>r.data),
 deleteType:(id:number)=>api.delete(`/hotels/provider/room-types/${id}`),
 rooms:()=>api.get<ProviderPhysicalRoom[]>('/hotels/provider/physical-rooms').then(r=>r.data),
 addRoom:(data:ProviderPhysicalRoomInput)=>api.post('/hotels/provider/physical-rooms',data).then(r=>r.data),
 editRoom:(id:number,data:ProviderPhysicalRoomInput)=>api.put(`/hotels/provider/physical-rooms/${id}`,data).then(r=>r.data),
 deleteRoom:(id:number)=>api.delete(`/hotels/provider/physical-rooms/${id}`),
}

export type PhysicalRoomInventory = {id:number;khachSanId:number;loaiPhongId:number;tenLoaiPhong:string;soPhong:string;tang:number;giaMoiDem:number;hinhAnh:string|null;moTa:string;tienNghi:string|null;soNguoiLon:number;soTreEm:number;trangThai:'INACTIVE'|'UNVERIFIED'|'AVAILABLE'|'BOOKED';coTheDatTheoNgay:boolean}
export const hotelApi = {
  physicalInventory:(id:number,start?:string,end?:string)=>api.get<PhysicalRoomInventory[]>(`/hotels/${id}/physical-inventory`,{params:start&&end?{checkIn:start,checkOut:end}:{}}).then(r=>r.data),
  globalMaxPhysicalPrice:()=>api.get<number>('/hotels/physical-inventory/max-price').then(r=>r.data),
  catalog: () => api.get<Hotel[]>('/hotels/catalog').then(r => r.data),
  search: (p: { thanhPho: string; ngayNhanPhong: string; ngayTraPhong: string; soKhach: number; minPrice?: number; maxPrice?: number }) => api.get<Hotel[]>('/hotels/search', { params: p }).then(r => r.data),
  detail: (id: number,start?:string,end?:string,guests?:number) => api.get<Hotel>(`/hotels/${id}`,{params:start&&end?{checkIn:start,checkOut:end,guests}:undefined}).then(r => r.data),
  room: (id: number, physicalRoomId?: number) => api.get<Room>(`/hotels/rooms/${id}`, {params: physicalRoomId ? {phongCuTheId: physicalRoomId} : {}}).then(r => r.data),
  mine: () => api.get<Hotel[]>('/hotels').then(r => r.data),
  create: (body: HotelRequest) => api.post<Hotel>('/hotels', body).then(r => r.data),
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string; fileName: string }>('/hotels/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  update: (id: number, body: HotelRequest) => api.put<Hotel>(`/hotels/${id}`, body).then(r => r.data),
  remove: (id: number) => api.delete(`/hotels/${id}`),
  createRoom: (hotelId: number, body: RoomRequest) => api.post<Room>(`/hotels/${hotelId}/rooms`, body).then(r => r.data),
  updateRoom: (hotelId: number, roomId: number, body: RoomRequest) => api.put<Room>(`/hotels/${hotelId}/rooms/${roomId}`, body).then(r => r.data),
  removeRoom: (hotelId: number, roomId: number) => api.delete(`/hotels/${hotelId}/rooms/${roomId}`),
}

export const attractionApi = {
  catalog: () => api.get<Attraction[]>('/attractions/catalog').then(r => r.data),
  search: (p: { thanhPho: string; ngaySuDung: string; soLuongVe: number }) => api.get<Attraction[]>('/attractions/search', { params: p }).then(r => r.data),
  detail: (id: number) => api.get<Attraction>(`/attractions/${id}`).then(r => r.data),
  ticket: (id: number) => api.get<TicketType>(`/attractions/tickets/${id}`).then(r => r.data),
  mine: () => api.get<Attraction[]>('/attractions').then(r => r.data),
  create: (body: AttractionRequest) => api.post<Attraction>('/attractions', body).then(r => r.data),
  update: (id: number, body: AttractionRequest) => api.put<Attraction>(`/attractions/${id}`, body).then(r => r.data),
  remove: (id: number) => api.delete(`/attractions/${id}`),
  uploadImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{fileName:string;url:string}>('/attractions/images/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  createTicket: (attractionId: number, body: TicketRequest) => api.post<TicketType>(`/attractions/${attractionId}/tickets`, body).then(r => r.data),
  updateTicket: (attractionId: number, ticketId: number, body: TicketRequest) => api.put<TicketType>(`/attractions/${attractionId}/tickets/${ticketId}`, body).then(r => r.data),
  removeTicket: (attractionId: number, ticketId: number) => api.delete(`/attractions/${attractionId}/tickets/${ticketId}`),
  ticketCategories: () => api.get<AttractionTicketCategory[]>('/attractions/ticket-categories').then(r => r.data),
}

export const bookingApi = {
  create: (body: BookingCreateRequest) => api.post<Booking>('/bookings', body).then(r => r.data),
  mine: () => api.get<Booking[]>('/bookings/me').then(r => r.data),
  providerMine: () => api.get<Booking[]>('/bookings/provider/me').then(r => r.data),
  detail: (id: number) => api.get<Booking>(`/bookings/${id}`).then(r => r.data),
  byCode: (code: string) => api.get<Booking>(`/bookings/code/${code}`).then(r => r.data),
  cancel: (id: number) => api.put<Booking>(`/bookings/${id}/cancel`).then(r => r.data),
  adminAll: () => api.get<Booking[]>('/bookings/admin').then(r => r.data),
  providerConfirmPayment: (id: number) => api.put<Booking>(`/bookings/${id}/provider-confirm-payment`).then(r => r.data),
  requestCancellation: (id: number, lyDo: string) => api.post<Booking>(`/bookings/${id}/cancel-request`, {lyDo}).then(r=>r.data),
  resolveCancellation: (id: number, approved: boolean, lyDoTuChoi = '') => api.put<Booking>(`/bookings/${id}/provider-resolve-cancellation`, {approved, lyDoTuChoi}).then(r=>r.data),
}

export const paymentApi = {
  create: (bookingId: number, idempotencyKey: string, phuongThuc: 'PAYPAL' | 'PAYOS' = 'PAYPAL') => api.post<Payment>('/payments', { bookingId, idempotencyKey, phuongThuc }).then(r => r.data),
  capturePaypal: (orderId: string) => api.post<Payment>(`/payments/paypal/orders/${encodeURIComponent(orderId)}/capture`).then(r => r.data),
  mine: () => api.get<Payment[]>('/payments/me').then(r => r.data),
  detail: (id: number) => api.get<Payment>(`/payments/${id}`).then(r => r.data),
  status: (id: number) => api.get<Payment>(`/payments/${id}/status`).then(r => r.data),
  byBookingCode: (code: string) => api.get<Payment>(`/payments/booking/${code}`).then(r => r.data),
  cancel: (id: number) => api.post<Payment>(`/payments/${id}/cancel`).then(r => r.data),
  refund: (id: number, body: { bookingItemId: number; soTien: number; lyDo: string; idempotencyKey: string }) => api.post<Refund>(`/payments/${id}/refund`, body).then(r => r.data),
  adminAll: () => api.get<Payment[]>('/payments/admin').then(r => r.data),
  adminRefunds: () => api.get<Refund[]>('/payments/admin/refunds').then(r => r.data),
  confirmRefund: (refundId: number, transactionCode: string) => api.put<Refund>(`/payments/refunds/${refundId}/confirm`, null, { params: { transactionCode } }).then(r => r.data),
}

export const notificationApi = {
  mine: () => api.get<NotificationItem[]>('/notifications').then(r => r.data),
  read: (id: number) => api.put<NotificationItem>(`/notifications/${id}/read`).then(r => r.data),
}

export const aiApi = {
  chat: (message: string) => api.post<AiResponse>('/ai/chat', { message }).then(r => r.data),
  recommend: (message: string) => api.post<AiResponse>('/ai/recommend', { message }).then(r => r.data),
  bookingHelp: (message: string, bookingCode?: string) => api.post<AiResponse>('/ai/booking-help', { message, bookingCode }).then(r => r.data),
  paymentHelp: (bookingCode: string) => api.post<AiResponse>('/ai/payment-help', { bookingCode }).then(r => r.data),
  cancelHelp: (bookingCode: string) => api.post<AiResponse>('/ai/cancel-help', { bookingCode }).then(r => r.data),
}

export const promotionApi = {
  generateCode: () => api.get<{ code: string }>('/promotions/generate-code').then(r => r.data.code),
  mine: () => api.get<PromotionApiResponse[]>('/promotions').then(r => r.data),
  available: (params?: { serviceType?: string; serviceId?: number; providerId?: number }) => api.get<PromotionApiResponse[]>('/promotions/available', { params }).then(r => r.data),
  publicDetail: (id: number) => api.get<PromotionApiResponse>(`/promotions/public/${id}`).then(r => r.data),
  detail: (id: number) => api.get<PromotionApiResponse>(`/promotions/${id}`).then(r => r.data),
  create: (body: PromotionRequest) => api.post<PromotionApiResponse>('/promotions', body).then(r => r.data),
  update: (id: number, body: PromotionRequest) => api.put<PromotionApiResponse>(`/promotions/${id}`, body).then(r => r.data),
  deactivate: (id: number) => api.put<PromotionApiResponse>(`/promotions/${id}/deactivate`).then(r => r.data),
  remove: (id: number) => api.delete<{ deleted: boolean; deactivated: boolean; message: string }>(`/promotions/${id}`).then(r => r.data),
  saved: () => api.get<PromotionApiResponse[]>('/promotions/saved').then(r => r.data),
  saveForCustomer: (id: number) => api.post<PromotionApiResponse>(`/promotions/${id}/save`).then(r => r.data),
  removeSaved: (id: number) => api.delete<void>(`/promotions/${id}/save`).then(r => r.data),
}

export interface ReviewItem { id:number; userId:number; bookingId:number; targetId:number; soSao:number; noiDung:string; ngayTao:string }
export const reviewApi = {
  hotelMine: () => api.get<ReviewItem[]>('/hotels/reviews/me').then(r=>r.data),
  attractionMine: () => api.get<ReviewItem[]>('/attractions/reviews/me').then(r=>r.data),
  flightMine: () => api.get<ReviewItem[]>('/flights/reviews/me').then(r=>r.data),
  hotelProvider: () => api.get<ReviewItem[]>('/hotels/reviews/provider').then(r=>r.data),
  attractionProvider: () => api.get<ReviewItem[]>('/attractions/reviews/provider').then(r=>r.data),
  flightProvider: () => api.get<ReviewItem[]>('/flights/reviews/provider').then(r=>r.data),
  createHotel: (body:{bookingId:number;targetId:number;soSao:number;noiDung:string}) => api.post<ReviewItem>('/hotels/reviews',body).then(r=>r.data),
  createAttraction: (body:{bookingId:number;targetId:number;soSao:number;noiDung:string}) => api.post<ReviewItem>('/attractions/reviews',body).then(r=>r.data),
  createFlight: (body:{bookingId:number;targetId:number;soSao:number;noiDung:string}) => api.post<ReviewItem>('/flights/reviews',body).then(r=>r.data),
}
