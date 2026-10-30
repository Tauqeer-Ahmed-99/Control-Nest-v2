import { APIResponse } from "@/models/api";
import { ControllerDevicePasswordSchema } from "@/models/contoller-device";
import { authenticate } from "@/services/auth";
import { checkOrSetControllerPassword } from "@/services/controller-device";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const body = await req.json();

    const params = validate({
      schema: ControllerDevicePasswordSchema,
      object: body,
    });

    const data = await checkOrSetControllerPassword(params, user.id);

    return APIResponse.fromData({
      data,
      message: "Success",
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
