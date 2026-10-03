export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'
export type PromotionStatus = 'ACTIVE' | 'SCHEDULED' | 'INACTIVE' | 'EXPIRED'
export type PromotionScope = 'FLIGHT' | 'HOTEL' | 'ATTRACTION'

export interface Promotion {
  id: number
  providerId: number | null
  createdBy: number
  providerName: string
  name: string
  code: string
  description: string
  imageUrl?: string | null
  discountType: PromotionDiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number | null
  startDate: string
  endDate: string
  maxUsage?: number | null
  perCustomerLimit?: number | null
  scope: PromotionScope
  serviceIds: number[]
  serviceName: string
  status: PromotionStatus
  usedCount: number
  createdAt: string
  updatedAt: string
}

export interface PromotionApiResponse {
  id: number
  providerId: number | null
  createdBy: number
  providerName: string
  name: string
  code: string
  description: string | null
  imageUrl?: string | null
  discountType: PromotionDiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number | null
  startDate: string
  endDate: string
  maxUsage: number | null
  maxUsagePerCustomer: number | null
  usedCount: number
  status: PromotionStatus
  serviceType: PromotionScope
  serviceIds: number[]
  createdAt: string
  updatedAt: string
}

export interface PromotionRequest {
  name: string
  code: string
  description?: string
  imageUrl?: string
  discountType: PromotionDiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number
  startDate: string
  endDate: string
  maxUsage?: number
  maxUsagePerCustomer?: number
  serviceType: PromotionScope
  serviceIds: number[]
}

export const SAVED_PROMOTIONS_KEY = 'takivivu.customer.saved-promotions.v1'

export function fromPromotionApi(item: PromotionApiResponse): Promotion {
  const scope = item.serviceType
  return {
    id: item.id,
    providerId: item.providerId,
    createdBy: item.createdBy,
    name: item.name,
    code: item.code,
    description: item.description || '',
    imageUrl: item.imageUrl || null,
    discountType: item.discountType,
    discountValue: Number(item.discountValue),
    minOrderAmount: Number(item.minOrderAmount || 0),
    maxDiscountAmount: item.maxDiscountAmount == null ? null : Number(item.maxDiscountAmount),
    startDate: item.startDate,
    endDate: item.endDate,
    maxUsage: item.maxUsage,
    perCustomerLimit: item.maxUsagePerCustomer,
    scope,
    serviceIds: item.serviceIds || [],
    serviceName: item.serviceIds?.length ? `${item.serviceIds.length} dịch vụ được chọn` : `Tất cả ${promotionScopeText(scope).toLowerCase()} của nhà cung cấp`,
    status: item.status,
    usedCount: item.usedCount || 0,
    providerName: item.providerName || (item.providerId == null ? 'TAKIVIVU' : `Nhà cung cấp #${item.providerId}`),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function loadSavedPromotionIds(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_PROMOTIONS_KEY) || '[]') as number[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePromotionForCustomer(id: number) {
  const ids = loadSavedPromotionIds()
  if (!ids.includes(id)) localStorage.setItem(SAVED_PROMOTIONS_KEY, JSON.stringify([id, ...ids]))
}

export function removeSavedPromotion(id: number) {
  localStorage.setItem(SAVED_PROMOTIONS_KEY, JSON.stringify(loadSavedPromotionIds().filter(value => value !== id)))
}

export function promotionValueText(item: Promotion) {
  return item.discountType === 'PERCENTAGE'
    ? `${item.discountValue}%`
    : `${item.discountValue.toLocaleString('vi-VN')} VNĐ`
}

export function promotionScopeText(scope: PromotionScope) {
  if (scope === 'FLIGHT') return 'Chuyến bay'
  if (scope === 'HOTEL') return 'Khách sạn'
  return 'Địa điểm tham quan'
}

export function promotionStatusText(status: PromotionStatus) {
  if (status === 'ACTIVE') return 'Đang áp dụng'
  if (status === 'SCHEDULED') return 'Sắp diễn ra'
  if (status === 'INACTIVE') return 'Đã ngừng'
  return 'Đã kết thúc'
}
