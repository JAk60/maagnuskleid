import { NextResponse } from "next/server"
import { createShipRocketOrder } from "@/lib/shiprocket/orderService"

export async function POST(req: Request) {
  try {
    const { orderId }:{orderId: string} = await req.json()

    const result = await createShipRocketOrder(orderId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("ShipRocket API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create ShipRocket order" },
      { status: 500 }
    )
  }
}