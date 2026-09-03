import { NextRequest, NextResponse } from "next/server";

import Driver from "@/models/Driver";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  await connectDB();
  const drivers = await Driver.find().populate("assignedBus").sort({ createdAt: -1 });
  return NextResponse.json({ drivers });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const driver = await Driver.create(body);
  return NextResponse.json({ driver }, { status: 201 });
}
