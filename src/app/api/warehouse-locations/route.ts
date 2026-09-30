import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const locations = await prisma.warehouseLocation.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Failed to fetch warehouse locations:", error);

    return NextResponse.json(
      { error: "Failed to fetch warehouse locations." },
      { status: 500 }
    );
  }
}