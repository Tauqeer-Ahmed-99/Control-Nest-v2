import { NextRequest } from "next/server";
import { APIResponse } from "@/models/api";
import { getReleasePolicy } from "@/services/firmware";

export async function GET(_req: NextRequest) {
  void _req;
  try {
    return APIResponse.fromData({
      data: await getReleasePolicy(),
      message: "Release policy",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
}
