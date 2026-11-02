import { NextRequest } from "next/server";
import z from "zod";
import { APIResponse } from "@/models/api";
import { authenticate, authenticateControllerDevice } from "@/services/auth";
import { authorizeHouse } from "@/services/auth-house";
import { validate } from "@/services/validation";
import { withRequestObservability } from "@/services/request-observability";
const AccessSchema = z.object({ accessToken: z.string().min(1) });
export const POST = withRequestObservability(
  async (req: NextRequest) => {
    try {
      const controller = await authenticateControllerDevice(req);
      const { accessToken } = validate({
        schema: AccessSchema,
        object: await req.json(),
      });
      const { user } = await authenticate(accessToken);
      const member = await authorizeHouse({
        houseId: controller.houseId,
        userId: user.id,
      });
      return APIResponse.fromData({
        data: { authorized: true, isAdmin: member.isAdmin, userId: user.id },
        message: "House access verified",
      });
    } catch (error) {
      return APIResponse.fromError(error);
    }
  },
  { record: false },
);
