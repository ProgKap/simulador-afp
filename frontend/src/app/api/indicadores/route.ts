import { NextResponse } from "next/server"
import { getIndicadores } from "@/lib/bcch"

export const runtime = "nodejs"

export async function GET() {
  const data = await getIndicadores(
    process.env.BCCH_USER,
    process.env.BCCH_PASS,
  )
  return NextResponse.json(data)
}
