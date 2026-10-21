import { NextResponse } from "next/server";

export const fail = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

export const unauthorized = () => fail("Unauthorized", 401);