// ShipRocket API Client with Authentication - ENHANCED ERROR HANDLING
import "server-only";
import {
	ShipRocketAuthResponse,
	ShipRocketCreateOrderPayload,
	ShipRocketCreateOrderResponse,
	ShipRocketGenerateAWBPayload,
	ShipRocketGenerateAWBResponse,
	ShipRocketPickupSchedulePayload,
	ShipRocketTrackingResponse,
	ShipRocketError,
} from "./types";

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
		this.baseURL =
			process.env.SHIPROCKET_API_URL ||
			"https://apiv2.shiprocket.in/v1/external";
		this.email = process.env.SHIPROCKET_EMAIL || "";
		this.password = process.env.SHIPROCKET_PASSWORD || "";

		if (!this.email || !this.password) {
			console.error(
				"❌ ShipRocket credentials not found in environment variables",
			);
		}
	}

	/**
	 * Authenticate with ShipRocket and get access token
	 */
	private async authenticate(): Promise<string> {
		try {
			console.log("🔐 Authenticating with ShipRocket...");

			const response = await fetch(`${this.baseURL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: this.email,
					password: this.password,
				}),
			});

			const data: unknown = await response.json();

			if (!response.ok) {
				const error = data as { message?: string; errors?: unknown };
				const errorMsg = error.message || JSON.stringify(data);
				console.error("❌ ShipRocket authentication failed:", errorMsg);
				throw new Error(`Authentication failed: ${errorMsg}`);
			}

			const authData = data as ShipRocketAuthResponse;
			this.token = authData.token;

			// Token expires in 10 days, set expiry to 9 days to be safe
			this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

			console.log("✅ ShipRocket authentication successful");
			return authData.token;
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error("❌ ShipRocket authentication error:", errorMsg);
			throw error;
		}
	}

	/**
	 * Get valid token (authenticate if needed)
	 */
	private async getToken(): Promise<string> {
		if (
			!this.token ||
			!this.tokenExpiry ||
			new Date() >= this.tokenExpiry
		) {
			return await this.authenticate();
		}
		return this.token;
	}

	/**
	 * Make authenticated API request
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const token = await this.getToken();

		console.log(
			`📡 ShipRocket API Request: ${options.method || "GET"} ${endpoint}`,
		);

		const response = await fetch(`${this.baseURL}${endpoint}`, {
			...options,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		const rawData = await response.text();
		console.log(`📥 ShipRocket Response Status: ${response.status}`);
		console.log(`📥 ShipRocket Response Body:`, rawData);

		let data: unknown;
		try {
			data = JSON.parse(rawData);
		} catch (parseError) {
			console.error(
				"❌ Failed to parse ShipRocket response as JSON:",
				rawData,
			);
			throw new Error(
				`Invalid JSON response from ShipRocket: ${rawData.substring(0, 200)}`,
			);
		}

		if (!response.ok) {
			const error = data as ShipRocketError;
			const errorMsg = error.message || JSON.stringify(error);

			console.error("❌ ShipRocket API error:", {
				status: response.status,
				statusText: response.statusText,
				error: error,
				message: errorMsg,
			});

			// Include error details in the thrown error
			if (error.errors) {
				throw new Error(
					`ShipRocket API Error: ${errorMsg} | Details: ${JSON.stringify(error.errors)}`,
				);
			}

			throw new Error(
				`ShipRocket API Error (${response.status}): ${errorMsg}`,
			);
		}

		return data as T;
	}

	/**
	 * Create order in ShipRocket
	 */
	async createOrder(
		payload: ShipRocketCreateOrderPayload,
	): Promise<ShipRocketCreateOrderResponse> {
		try {
			console.log("📦 Creating ShipRocket order...");
			console.log("📦 Payload:", JSON.stringify(payload, null, 2));

			const response = await this.request<ShipRocketCreateOrderResponse>(
				"/orders/create/adhoc",
				{
					method: "POST",
					body: JSON.stringify(payload),
				},
			);

			console.log("✅ ShipRocket order created successfully:", response);
			return response;
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : JSON.stringify(error);
			console.error("❌ Failed to create ShipRocket order:", errorMsg);
			throw error;
		}
	}

	/**
	 * Generate AWB (Air Waybill) for shipment - with auto courier recommendation
	 */
	async generateAWB(
		payload: ShipRocketGenerateAWBPayload,
	): Promise<ShipRocketGenerateAWBResponse> {
		try {
			console.log("🎫 Generating AWB...");
			console.log("🎫 Payload:", JSON.stringify(payload, null, 2));

			// If no courier_id provided, use ShipRocket's recommendation endpoint
			if (!payload.courier_id) {
				console.log(
					"ℹ️ No courier specified, using ShipRocket recommendation...",
				);

				// Use the recommend endpoint instead
				const response =
					await this.request<ShipRocketGenerateAWBResponse>(
						"/courier/assign/recommend",
						{
							method: "POST",
							body: JSON.stringify({
								shipment_id: payload.shipment_id,
							}),
						},
					);

				console.log("✅ AWB generated via recommendation:", response);
				return response;
			}

			// If courier_id is provided, use normal assignment
			const response = await this.request<ShipRocketGenerateAWBResponse>(
				"/courier/assign/awb",
				{
					method: "POST",
					body: JSON.stringify(payload),
				},
			);

			console.log("✅ AWB generated:", response);
			return response;
		} catch (error) {
			console.error("❌ Failed to generate AWB:", error);
			throw error;
		}
	}

	/**
	 * Schedule pickup for shipment
	 */
	async schedulePickup(
		payload: ShipRocketPickupSchedulePayload,
	): Promise<PickupScheduleResponse> {
		try {
			console.log("📅 Scheduling pickup...");

			const response = await this.request<PickupScheduleResponse>(
				"/courier/generate/pickup",
				{
					method: "POST",
					body: JSON.stringify(payload),
				},
			);

			console.log("✅ Pickup scheduled:", response);
			return response;
		} catch (error) {
			console.error("❌ Failed to schedule pickup:", error);
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
					method: "GET",
				},
			);

			return response;
		} catch (error) {
			console.error("❌ Failed to track shipment:", error);
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
		cod: 0 | 1 = 0,
	): Promise<CourierServiceabilityResponse> {
		try {
			const response = await this.request<CourierServiceabilityResponse>(
				`/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${cod}`,
				{
					method: "GET",
				},
			);

			return response;
		} catch (error) {
			console.error("❌ Failed to get available couriers:", error);
			throw error;
		}
	}

	/**
	 * Cancel shipment
	 */
	async cancelShipment(
		shipmentIds: number[],
	): Promise<CancelShipmentResponse> {
		try {
			const response = await this.request<CancelShipmentResponse>(
				"/orders/cancel",
				{
					method: "POST",
					body: JSON.stringify({ ids: shipmentIds }),
				},
			);

			console.log("✅ Shipment cancelled:", response);
			return response;
		} catch (error) {
			console.error("❌ Failed to cancel shipment:", error);
			throw error;
		}
	}
}

// Export singleton instance
export const shipRocketClient = new ShipRocketClient();
