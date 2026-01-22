// app/api/admin/shiprocket/create-order/route.ts

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import {
  createShipRocketOrder,
  generateAWBForOrder,
  schedulePickupForOrder,
} from "@/lib/shiprocket/orderService"

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ShipRocketAction = "create" | "generate_awb" | "schedule_pickup"

interface ShipRocketRequestBody {
  orderId: string
  action?: ShipRocketAction
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "ShipRocket request failed"
}

/* -------------------------------------------------------------------------- */
/*                           SUPABASE (LAZY INIT)                              */
/* -------------------------------------------------------------------------- */

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient()

  try {
    const rawBody = await req.json()

    if (!isObject(rawBody)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    if (typeof rawBody.orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    const body = rawBody as unknown as ShipRocketRequestBody
    const orderId = body.orderId
    const action: ShipRocketAction = body.action ?? "create"

    let result: unknown

    switch (action) {
      case "create": {
        result = await createShipRocketOrder(orderId)
        break
      }

      case "generate_awb": {
        const { data: order, error } = await supabase
          .from("orders")
          .select("shiprocket_shipment_id")
          .eq("id", orderId)
          .single()

        if (error || !order?.shiprocket_shipment_id) {
          return NextResponse.json(
            { error: "Shipment ID not found. Create order first." },
            { status: 400 }
          )
        }

        result = await generateAWBForOrder(
          orderId,
          Number(order.shiprocket_shipment_id)
        )
        break
      }

      case "schedule_pickup": {
        result = await schedulePickupForOrder(orderId)
        break
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: unknown) {
    console.error("Admin ShipRocket API error:", error)

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
