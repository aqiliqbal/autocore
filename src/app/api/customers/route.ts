import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
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

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      address,
      city,
      taxNumber,
      notes,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 }
      );
    }

    // Generate a unique customer code.
    const customerCode = `CUS-${Date.now()}`;

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name: String(name).trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
        city: city ? String(city).trim() : null,
        taxNumber: taxNumber
          ? String(taxNumber).trim()
          : null,
        notes: notes ? String(notes).trim() : null,
        isActive: true,
      },
      include: {
        sales: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(customer, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      { error: "Failed to create customer." },
      { status: 500 }
    );
  }
}