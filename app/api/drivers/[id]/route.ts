import { NextRequest, NextResponse } from "next/server";

import Driver from "@/models/Driver";
import { connectDB } from "@/libs/mongodb";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const body = await req.json();
  const driver = await Driver.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json({ driver });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  await Driver.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
