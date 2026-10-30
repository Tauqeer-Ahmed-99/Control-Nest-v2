import { APIResponse } from "@/models/api";
import { GetGPIOPinsConfigSchema } from "@/models/gpio-pins";
import { authenticate } from "@/services/auth";
import { getGPIOPins } from "@/services/gpio-pins";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const mode = req.nextUrl.searchParams.get("mode");
    const houseId = req.nextUrl.searchParams.get("houseId");

    const params = validate({
      schema: GetGPIOPinsConfigSchema,
      object: { mode, houseId },
    });

    const data = await getGPIOPins(params, user.id);

    return APIResponse.fromData({ data, message: "GPIO Pins fetched." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
};
