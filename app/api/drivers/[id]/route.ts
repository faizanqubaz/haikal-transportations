import { NextRequest, NextResponse } from "next/server";

import Driver from "@/models/Driver";
import { connectDB } from "@/libs/mongodb";
type Params = {
  params: Promise<{
    id: string;
  }>;
};
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  await connectDB();
  const body = await req.json();
  const driver = await Driver.findByIdAndUpdate((await params).id, body, { new: true });
  return NextResponse.json({ driver });
}

export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  await connectDB();
  await Driver.findByIdAndDelete((await params).id);
  return NextResponse.json({ success: true });
}
