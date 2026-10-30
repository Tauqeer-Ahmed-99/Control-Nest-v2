import { APIResponse } from "@/models/api";
import { SwitchDeviceSchema } from "@/models/device";
import { authenticate } from "@/services/auth";
import { switchDevice } from "@/services/device";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { user, token: accessToken } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: SwitchDeviceSchema, object: body });

    const data = await switchDevice(params, user.id, accessToken);

    return APIResponse.fromData({
      data,
      message: "Device switched.",
      statusCode: 200,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
