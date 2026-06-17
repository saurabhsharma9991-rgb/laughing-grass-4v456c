import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/guards.js";

export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message, status = 400, code = "BAD_REQUEST", details = null) {
  const body = {
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error, fallbackMessage = "An unexpected error occurred.") {
  if (error instanceof AuthError) {
    return apiError(error.message, error.status, error.code);
  }

  console.error("[API]", error);
  const message =
    process.env.NODE_ENV === "production" ? fallbackMessage : error?.message || fallbackMessage;
  return apiError(message, 500, "INTERNAL_ERROR");
}

export async function withHandler(handler) {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}
