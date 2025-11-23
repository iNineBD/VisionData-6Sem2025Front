export interface TermItem {
  id: number
  termId: number
  itemOrder: number
  title: string
  content: string
  isMandatory: boolean
  isActive: boolean
}

export interface Term {
  id: number
  version: string
  title: string
  description: string
  content: string
  isActive: boolean
  effectiveDate: string
  createdAt: string
  items: TermItem[]
}

export interface ActiveTermResponse {
  success: boolean
  timestamp: string
  data: Term
  message: string
}

export interface ItemConsentRequest {
  itemId: number
  accepted: boolean
}

export interface TermConsentRequest {
  termId: number
  itemConsents: ItemConsentRequest[]
}

export interface ItemConsentDetail {
  itemId: number
  itemTitle: string
  accepted: boolean
  isMandatory: boolean
}

export interface UserConsent {
  id: number
  userId: number
  termId: number
  termVersion: string
  consentDate: string
  isActive: boolean
  itemConsents: ItemConsentDetail[]
}

export interface ConsentStatus {
  userId: number
  hasActiveConsent: boolean
  currentTermId?: number
  currentTermVersion?: string
  currentTermTitle?: string
  consentDate?: string
  needsNewConsent: boolean
}

export interface ConsentStatusResponse {
  success: boolean
  timestamp: string
  data: ConsentStatus
  message: string
}

export interface UserConsentResponse {
  success: boolean
  timestamp: string
  data: UserConsent
  message: string
}

export interface ApiErrorResponse {
  success: false
  timestamp: string
  error: string
  code: number
  message: string
  details?: string
}

// Tipos adicionais para gerenciamento de termos

export interface TermListItem {
  id: number
  version: string
  title: string
  description: string
  isActive: boolean
  effectiveDate: string
  createdAt: string
  itemCount?: number
}

export interface AllTermsResponse {
  success: boolean
  timestamp: string
  data: {
    terms: TermListItem[]
    totalCount: number
    page: number
    pageSize: number
  }
  message: string
}

export interface CreateTermRequest {
  version: string
  title: string
  description: string
  content: string
  effectiveDate: string
  items: Array<{
    itemOrder: number
    title: string
    content: string
    isMandatory: boolean
  }>
}

export interface CreateTermResponse {
  success: boolean
  timestamp: string
  data: Term
  message: string
}
