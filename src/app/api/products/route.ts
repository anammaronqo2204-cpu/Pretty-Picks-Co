import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, inArray } from "drizzle-orm";
import { publicProductColumns, livePredicate } from "@/lib/data";

/** Public product lookup (wishlist). Only public columns are selected. */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").map(Number).filter(Number.isInteger).slice(0, 100);
  if (!ids.length) return NextResponse.json([]);
  const rows = await db.select(publicProductColumns).from(products).where(and(inArray(products.id, ids), livePredicate()));
  return NextResponse.json(rows);
}
