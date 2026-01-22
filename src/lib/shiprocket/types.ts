// ShipRocket TypeScript Interfaces

export interface ShipRocketAuthResponse {
  token: string;
  expires_at?: string;
}

export interface ShipRocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShipRocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShipRocketOrderItem[];
  payment_method: string;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShipRocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

export interface ShipRocketGenerateAWBPayload {
  shipment_id: number;
  courier_id?: number;
}

export interface ShipRocketGenerateAWBResponse {
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  awb_assign_error?: string;
  response?: {
    data?: {
      awb_code?: string;
      courier_company_id?: number;
      courier_name?: string;
    }
  }
}

export interface ShipRocketPickupSchedulePayload {
  shipment_id: number[];
  pickup_date?: string;
}

export interface ShipRocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: string;
    shipment_track: Array<{
      id: string;
      awb_code: string;
      courier_company_id: string;
      shipment_status: string;
      current_status: string;
      delivered_date?: string;
      edd?: string;
    }>;
    shipment_track_activities: Array<{
      date: string;
      status: string;
      activity: string;
      location: string;
    }>;
  };
}

export interface ShipRocketWebhookPayload {
  order_id: string;
  awb: string;
  courier_name: string;
  current_status: string;
  shipment_status: string;
  edd?: string;
  scans?: Array<{
    date: string;
    activity: string;
    location: string;
  }>;
}

export interface ShipRocketError {
  message: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

export interface SupabaseOrder {
  id: string;
  order_number: string;
  user_id: string;
  items: ShipRocketOrderItem[];
  shipping_address: {
    first_name: string;
    last_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  razorpay_payment_id?: string;
}

export interface ProductWithShipping {
  id: number;
  name: string;
  sku?: string;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}