/**
 * Types pour le SDK InvoiceIQ
 */

export interface InvoiceIQConfig {
  apiKey?: string;
  bearerToken?: string;
  baseUrl?: string;
}

export interface Address {
  line1?: string;
  line2?: string;
  postCode?: string;
  city?: string;
  countryCode: string;
}

export interface Party {
  name: string;
  registrationId?: string;
  vatId?: string;
  countryCode: string;
  address?: Address;
  email?: string;
  // Alternative flat structure
  addressLine1?: string;
  addressLine2?: string;
  postCode?: string;
  city?: string;
}

export interface InvoiceLine {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitCode?: string;
  unitPrice?: number;
  netPrice?: number;
  taxRate?: number;
  taxCategoryCode?: string;
  taxExemptionReason?: string;
  totalAmount: number;
}

export interface TaxSummary {
  taxRate: number;
  taxableAmount?: number;
  basisAmount?: number;
  taxAmount: number;
  taxCategoryCode?: string;
  taxExemptionReason?: string;
}

export interface PaymentMeans {
  typeCode?: string;
  accountIBAN?: string;
  accountBIC?: string;
  accountName?: string;
}

export interface Logo {
  url: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface Footer {
  extraText?: string;
  showPageNumbers?: boolean;
}

export interface RenderingOptions {
  template?: string;
  font?: 'Helvetica' | 'Times' | 'Courier' | 'DejaVuSans';
  primaryColor?: string;
  accentColor?: string;
  logo?: Logo;
  footer?: Footer;
  notes?: string;
  locale?: string;
}

export interface InvoiceMetadata {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  currency?: string;
  typeCode?: string;
  seller: Party;
  buyer: Party;
  lines?: InvoiceLine[];
  taxes?: TaxSummary[];
  taxSummaries?: TaxSummary[];
  totalTaxExclusiveAmount: number;
  totalTaxInclusiveAmount: number;
  taxTotalAmount: number;
  purchaseOrderReference?: string;
  notes?: string;
  paymentMeans?: PaymentMeans;
  rendering?: RenderingOptions;
}

export interface ValidationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
  reportDownloadUrl?: string;
}

export interface TransformationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
  reportDownloadUrl?: string;
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
  reportDownloadUrl?: string;
}

export interface ValidationReport {
  transformation?: string;
  finalScore?: number;
  profile?: string;
  issues?: Array<{
    message: string;
    code: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
