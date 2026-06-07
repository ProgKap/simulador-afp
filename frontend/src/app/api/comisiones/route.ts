import { NextResponse } from "next/server"
import { COMISIONES } from "@/lib/simulator"

export const runtime = "nodejs"

const QUETALMIAFP_URL = "https://queafp.cl/api/comisiones"

export async function GET() {
  try {
    const res = await fetch(QUETALMIAFP_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(COMISIONES)
  }
}
