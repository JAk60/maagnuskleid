// ShipRocket API Client with Authentication

import {
  ShipRocketAuthResponse,
  ShipRocketCreateOrderPayload,
  ShipRocketCreateOrderResponse,
  ShipRocketGenerateAWBPayload,
  ShipRocketGenerateAWBResponse,
  ShipRocketPickupSchedulePayload,
  ShipRocketTrackingResponse,
  ShipRocketError,
} from './types';

// Add new type definitions for responses
interface CourierServiceabilityResponse {
  available_courier_companies: Array<{
    courier_company_id: number;
    courier_name: string;
    freight_charge: number;
    rate: number;
  }>;
}

interface PickupScheduleResponse {
  pickup_scheduled_date: string;
  pickup_token_number: string;
  status: number;
  response: {
    pickup_scheduled_date: string;
    pickup_token_number: string;
  };
}

interface CancelShipmentResponse {
  message: string;
  status_code: number;
}

class ShipRocketClient {
  private baseURL: string;
  private email: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseURL = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.email = process.env.SHIPROCKET_EMAIL || '';
    this.password = process.env.SHIPROCKET_PASSWORD || '';

    if (!this.email || !this.password) {
      console.error('ShipRocket credentials not found in environment variables');
    }
  }

  /**
   * Authenticate with ShipRocket and get access token
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Authentication failed: ${error.message || response.statusText}`);
      }

      const data: ShipRocketAuthResponse = await response.json();
      this.token = data.token;
      
      // Token expires in 10 days, set expiry to 9 days to be safe
      this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      
      console.log('ShipRocket authentication successful');
      return data.token;
    } catch (error) {
      console.error('ShipRocket authentication error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get valid token (authenticate if needed)
   */
  private async getToken(): Promise<string> {
    // If no token or expired, authenticate
    if (!this.token || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      return await this.authenticate();
    }
    return this.token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const error = data as ShipRocketError;
      console.error('ShipRocket API error:', error);
      throw new Error(error.message || 'ShipRocket API request failed');
    }

    return data as T;
  }

  /**
   * Create order in ShipRocket
   */
  async createOrder(
    payload: ShipRocketCreateOrderPayload
  ): Promise<ShipRocketCreateOrderResponse> {
    try {
      const response = await this.request<ShipRocketCreateOrderResponse>(
        '/orders/create/adhoc',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log('ShipRocket order created:', response);
      return response;
    } catch (error) {
      console.error('Failed to create ShipRocket order:', error);
      throw error;
    }
  }

  /**
   * Generate AWB (Air Waybill) for shipment
   */
  async generateAWB(
    payload: ShipRocketGenerateAWBPayload
  ): Promise<ShipRocketGenerateAWBResponse> {
    try {
      const response = await this.request<ShipRocketGenerateAWBResponse>(
        '/courier/assign/awb',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log('AWB generated:', response);
      return response;
    } catch (error) {
      console.error('Failed to generate AWB:', error);
      throw error;
    }
  }

  /**
   * Schedule pickup for shipment
   */
  async schedulePickup(
    payload: ShipRocketPickupSchedulePayload
  ): Promise<PickupScheduleResponse> {
    try {
      const response = await this.request<PickupScheduleResponse>('/courier/generate/pickup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('Pickup scheduled:', response);
      return response;
    } catch (error) {
      console.error('Failed to schedule pickup:', error);
      throw error;
    }
  }

  /**
   * Track shipment by AWB or order ID
   */
  async trackShipment(awb: string): Promise<ShipRocketTrackingResponse> {
    try {
      const response = await this.request<ShipRocketTrackingResponse>(
        `/courier/track/awb/${awb}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to track shipment:', error);
      throw error;
    }
  }

  /**
   * Get available couriers for a shipment
   */
  async getAvailableCouriers(
    pickupPostcode: string,
    deliveryPostcode: string,
    weight: number,
    cod: 0 | 1 = 0
  ): Promise<CourierServiceabilityResponse> {
    try {
      const response = await this.request<CourierServiceabilityResponse>(
        `/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${cod}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to get available couriers:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(shipmentIds: number[]): Promise<CancelShipmentResponse> {
    try {
      const response = await this.request<CancelShipmentResponse>('/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ ids: shipmentIds }),
      });

      console.log('Shipment cancelled:', response);
      return response;
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const shipRocketClient = new ShipRocketClient();