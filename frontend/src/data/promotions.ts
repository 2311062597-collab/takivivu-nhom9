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

export function fromPromotionApi(item: PromotionApiResponse): Promotion {
  const serviceIds = Array.isArray(item.serviceIds) ? item.serviceIds : []
  const serviceName = serviceIds.length > 0
    ? `${promotionScopeText(item.serviceType)} #${serviceIds.join(', #')}`
    : `Tất cả ${promotionScopeText(item.serviceType).toLowerCase()}`
  return {
    id: item.id,
    providerId: item.providerId ?? null,
    createdBy: item.createdBy,
    providerName: item.providerName || 'Nhà cung cấp',
    name: item.name,
    code: item.code,
    description: item.description || '',
    imageUrl: item.imageUrl ?? null,
    discountType: item.discountType,
    discountValue: Number(item.discountValue || 0),
    minOrderAmount: Number(item.minOrderAmount || 0),
    maxDiscountAmount: item.maxDiscountAmount ?? null,
    startDate: item.startDate,
    endDate: item.endDate,
    maxUsage: item.maxUsage ?? null,
    perCustomerLimit: item.maxUsagePerCustomer ?? null,
    scope: item.serviceType,
    serviceIds,
    serviceName,
    status: item.status,
    usedCount: Number(item.usedCount || 0),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}
