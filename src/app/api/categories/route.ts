// src/app/api/categories/route.ts
// Public API — fetches active categories only

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Failed to fetch categories";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") as "Male" | "Female" | null;

    let query = supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (gender) {
      // Include Unisex categories when filtering by gender
      query = query.in("gender", [gender, "Unisex"]);
    }

    const { data: categories, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: categories ?? [] });
  } catch (error: unknown) {
    console.error("Categories API Error:", error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}