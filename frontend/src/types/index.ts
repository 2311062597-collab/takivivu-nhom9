export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
export type ProviderType = 'FLIGHT' | 'HOTEL' | 'ATTRACTION'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_APPROVAL'

export interface LoginRequest { email: string; matKhau: string }
export interface LoginResponse {
  id: number
  hoTen: string
  email: string
  vaiTro: Role
  loaiNhaCungCap: ProviderType | null
  trangThai: UserStatus
  accessToken: string
  refreshToken: string
}
export interface CustomerRegisterRequest { hoTen: string; email: string; soDienThoai: string; matKhau: string; xacNhanMatKhau: string }
export interface ProviderRegisterRequest extends CustomerRegisterRequest {
  tenDoanhNghiep: string
  anhGiayPhepKinhDoanh: string
  loaiNhaCungCap: ProviderType
}
export interface Profile {
  id: number
  hoTen: string
  email: string
  soDienThoai: string
  vaiTro: Role
  trangThai: UserStatus
  anhDaiDien: string | null
  diaChi: string | null
  tenDoanhNghiep?: string | null
  tenVietTat?: string | null
  moTaDoanhNghiep?: string | null
  maSoThue?: string | null
  namThanhLap?: string | null
  website?: string | null
  emailDoanhNghiep?: string | null
  soDienThoaiDoanhNghiep?: string | null
  diaChiDoanhNghiep?: string | null
  anhBia?: string | null
  logo?: string | null
}
export interface UpdateProfileRequest { hoTen: string; soDienThoai: string; anhDaiDien?: string; diaChi?: string; tenDoanhNghiep?: string; tenVietTat?: string; moTaDoanhNghiep?: string; maSoThue?: string; namThanhLap?: string; website?: string; emailDoanhNghiep?: string; soDienThoaiDoanhNghiep?: string; diaChiDoanhNghiep?: string; anhBia?: string; logo?: string }

export type FlightStatus = 'SCHEDULED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED'
export interface Flight {
  id: number
  nhaCungCapId: number
  maChuyenBay: string
  hangHangKhong: string
  diemDi: string
  diemDen: string
  sanBayDi: string
  sanBayDen: string
  thoiGianKhoiHanh: string
  thoiGianDen: string
  hangVe: string
  giaVe: number
  tongSoGhe: number
  soGheConLai: number
  trangThai: FlightStatus
}
export interface FlightInventory {
  flightId: number
  fares: { id:number; hangVe:string; giaVe:number; soGhe:number; soGheConLai:number }[]
  seats: { id:number; maGhe:string; hangVe:string; trangThai:string }[]
}
export interface FlightRequest {
  maChuyenBay: string
  hangHangKhong: string
  diemDi: string
  diemDen: string
  sanBayDi: string
  sanBayDen: string
  thoiGianKhoiHanh: string
  thoiGianDen: string
  hangVe: string
  giaVe: number
  tongSoGhe: number
  hangVes?: { hangVe: string; giaVe: number; soGhe: number }[]
}

export type HotelStatus = 'ACTIVE' | 'INACTIVE'
export type RoomStatus = 'AVAILABLE' | 'UNAVAILABLE'
export interface Room {
  id: number
  khachSanId: number
  tenLoaiPhong: string
  anhThuVien?: string
  moTa: string
  giaMoiDem: number
  tongSoPhong: number
  soPhongConLai: number
  sucChua: number
  trangThai: RoomStatus
}
export interface Hotel {
  hoSoHoanThien?: boolean
  id: number
  nhaCungCapId: number
  tenKhachSan: string
  moTa: string
  diaChi: string
  thanhPho: string
  soDienThoai?: string
  email?: string
  hinhAnh?: string
  viDo: number
  kinhDo: number
  soSao: number
  soTang: number
  trangThai: HotelStatus
  danhSachPhong: Room[]
  quanHuyen?: string
  tienNghi?: string
  anhGioiThieu?: string
  anhThuVien?: string
}
export interface HotelRequest {
  tenKhachSan: string
  moTa: string
  diaChi: string
  thanhPho: string
  soDienThoai?: string
  email?: string
  hinhAnh?: string
  viDo: number
  kinhDo: number
  soSao: number
  soTang: number
  quanHuyen: string
  tienNghi: string
  anhGioiThieu: string
  anhThuVien?: string
}
export interface RoomRequest { tenLoaiPhong: string; moTa: string; giaMoiDem: number; tongSoPhong: number; sucChua: number }

export type AttractionStatus = 'ACTIVE' | 'INACTIVE'
export type TicketStatus = 'AVAILABLE' | 'UNAVAILABLE'
export interface TicketType {
  id: number
  diaDiemId: number
  maLoaiVe: string
  tenLoaiVe: string
  doiTuongApDung: string
  moTa: string
  giaVe: number
  tongSoVe: number
  soVeConLai: number
  ngayBatDau: string
  ngayKetThuc: string
  trangThai: TicketStatus
}
export interface Attraction {
  id: number
  nhaCungCapId: number
  tenDiaDiem: string
  moTa: string
  diaChi: string
  quanHuyen: string
  thanhPho: string
  loaiDiaDiem: string
  tienIch: string[]
  viDo: number
  kinhDo: number
  placeId: string | null
  gioMoCua: string
  gioDongCua: string
  hinhAnh: string | null
  trangThai: AttractionStatus
  danhSachLoaiVe: TicketType[]
}
export interface AttractionRequest {
  tenDiaDiem: string
  moTa: string
  diaChi: string
  quanHuyen: string
  thanhPho: string
  loaiDiaDiem: string
  tienIch: string[]
  viDo: number
  kinhDo: number
  placeId?: string
  gioMoCua: string
  gioDongCua: string
  hinhAnh?: string
}
export interface TicketRequest { maLoaiVe: string; moTa: string; giaVe: number; tongSoVe: number; ngayBatDau: string; ngayKetThuc: string }
export interface AttractionTicketCategory { maLoaiVe: string; tenLoaiVe: string; doiTuongApDung: string; thuTu: number }

export type ServiceType = 'FLIGHT' | 'HOTEL' | 'ATTRACTION'
export type BookingStatus = 'PENDING_PAYMENT' | 'PAYMENT_RECEIVED' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'PAYMENT_FAILED' | 'EXPIRED' | 'CANCELLED' | 'RECONCILIATION_REQUIRED' | 'CANCEL_REQUESTED' | 'REFUND_PENDING' | 'REFUNDED'
export interface BookingItem {
  id: number
  loaiDichVu: ServiceType
  dichVuId: number
  nhaCungCapId: number | null
  soLuong: number
  donGia: number
  thanhTien: number
  ngayBatDau: string | null
  ngayKetThuc: string | null
  thongTinBoSung: string | null
}
export interface Booking {
  id: number
  maBooking: string
  khachHangId: number
  tongTienGoc: number
  uuDaiId: number | null
  maUuDai: string | null
  soTienGiam: number
  tongTien: number
  trangThai: BookingStatus
  hetHanThanhToan: string
  danhSachDichVu: BookingItem[]
  lyDoHuy?: string | null
  lyDoTuChoiHuy?: string | null
  hanXuLyHuy?: string | null
}
export interface BookingCreateRequest {
  idempotencyKey: string
  promotionCode?: string
  danhSachDichVu: Array<{
    loaiDichVu: ServiceType
    dichVuId: number
    soLuong: number
    ngayBatDau?: string
    ngayKetThuc?: string
    thongTinBoSung?: string
  }>
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'RECONCILIATION_REQUIRED' | 'REFUND_PENDING' | 'REFUNDED'
export interface Payment {
  id: number
  maThanhToan: string
  bookingId: number
  maBooking: string
  khachHangId: number
  soTien: number
  phuongThuc: 'PAYPAL' | 'PAYOS'
  trangThai: PaymentStatus
  maNganHang: string | null
  soTaiKhoan: string | null
  tenTaiKhoan: string | null
  noiDungChuyenKhoan: string | null
  qrUrl: string | null
  transactionCode: string | null
  paypalOrderId: string | null
  paypalCaptureId: string | null
  paypalApprovalUrl: string | null
  paypalCurrency: string | null
  paypalAmount: number | null
  payosPaymentLinkId: string | null
  payosCheckoutUrl: string | null
  hetHanLuc: string
  ngayTao: string
  thanhToanLuc: string | null
}
export interface Refund {
  id: number
  maHoanTien: string
  paymentId: number
  bookingId: number
  bookingItemId: number | null
  soTien: number
  lyDo: string
  trangThai: 'PENDING' | 'SUCCESS' | 'FAILED'
  refundTransactionCode: string | null
  ngayTao: string
  hoanTienLuc: string | null
}
export interface QrPayment {
  paymentId: number
  maPayment: string
  maBooking: string
  nganHang: string
  soTaiKhoan: string
  tenTaiKhoan: string
  soTien: number
  noiDungChuyenKhoan: string
  qrUrl: string
  hetHanLuc: string
}

export type NotificationType = 'REGISTER_SUCCESS' | 'BOOKING_CREATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'REFUND_SUCCESS' | 'PROVIDER_NEW_BOOKING' | 'PROVIDER_BOOKING_CANCELLED'
export interface NotificationItem {
  id: number
  userId: number
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  readAt: string | null
}
export interface AiResponse { answer: string; intent: string; canNavigate: boolean; navigateTo: string | null }

export interface PlaceSearch { name: string; address: string; area: string; placeId: string; latitude: number; longitude: number }
export interface Geocode { address: string; latitude: number; longitude: number; placeId: string; city: string | null; district: string | null; specificAddress: string | null }
export interface Distance { distanceMeters: number; distanceText: string; durationSeconds: number; durationText: string }


export interface AdminDashboard {
  tongNguoiDung: number
  tongKhachHang: number
  tongNhaCungCap: number
  nhaCungCapChoDuyet: number
  nhaCungCapDaDuyet: number
  nhaCungCapBiTuChoi: number
  taiKhoanDangHoatDong: number
  taiKhoanBiKhoa: number
}

export interface AdminUser {
  id: number
  hoTen: string
  email: string
  soDienThoai: string
  vaiTro: Role
  trangThai: UserStatus
  anhDaiDien: string | null
  diaChi: string | null
  ngayTao: string | null
  ngayCapNhat: string | null
  providerProfileId: number | null
  tenDoanhNghiep: string | null
  anhGiayPhepKinhDoanh: string | null
  loaiNhaCungCap: ProviderType | null
  trangThaiDuyet: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  lyDoTuChoi: string | null
}

export interface PendingProvider {
  providerProfileId: number
  nguoiDungId: number
  hoTen: string
  email: string
  soDienThoai: string
  tenDoanhNghiep: string
  anhGiayPhepKinhDoanh: string
  loaiNhaCungCap: ProviderType
  trangThaiDuyet: 'PENDING' | 'APPROVED' | 'REJECTED'
  trangThaiTaiKhoan: UserStatus
  lyDoTuChoi: string | null
  thongBao: string | null
}
