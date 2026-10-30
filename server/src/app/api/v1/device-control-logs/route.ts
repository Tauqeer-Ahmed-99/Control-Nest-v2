import { APIResponse } from "@/models/api";
import { SearchDeviceControlLogs } from "@/models/device-control-logs";
import { authenticate } from "@/services/auth";
import { searchDeviceControlLogs } from "@/services/device-control-logs";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const houseId = req.nextUrl.searchParams.get("houseId");
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    const page = Number(req.nextUrl.searchParams.get("page")!);
    const limit = Number(req.nextUrl.searchParams.get("limit")!);

    const queryParams: {
      page: number;
      limit: number;
      houseId?: string | undefined;
      deviceId?: string | undefined;
    } = {
      houseId: houseId ?? undefined,
      deviceId: deviceId ?? undefined,
      page,
      limit,
    };

    if (houseId) {
      delete queryParams.deviceId;
    } else {
      delete queryParams.houseId;
    }

    const params = validate({
      schema: SearchDeviceControlLogs,
      object: queryParams,
    });

    const data = await searchDeviceControlLogs(params, user.id);

    return APIResponse.fromData({ data, message: "Logs fetched" });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
