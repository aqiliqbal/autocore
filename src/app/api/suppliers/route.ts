import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchases: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);

    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      supplierCode,
      name,
      contactName,
      email,
      phone,
      address,
      city,
      taxNumber,
      notes,
    } = body;

    if (!supplierCode || !name) {
      return NextResponse.json(
        {
          error: "Supplier code and supplier name are required.",
        },
        { status: 400 }
      );
    }

    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        supplierCode,
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        {
          error: "A supplier with this supplier code already exists.",
        },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
        isActive: true,
      },
      include: {
        purchases: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier:", error);

    return NextResponse.json(
      {
        error: "Failed to create supplier.",
      },
      { status: 500 }
    );
  }
}