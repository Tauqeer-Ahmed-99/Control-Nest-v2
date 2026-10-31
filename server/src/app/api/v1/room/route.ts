import { APIResponse } from "@/models/api";
import { CreateRoomSchema, RemoveRoomSchema } from "@/models/room";
import { authenticate } from "@/services/auth";
import { createRoom, removeRoom } from "@/services/rooms";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: CreateRoomSchema, object: body });

    const data = await createRoom(params, user.id);

    return APIResponse.fromData({
      data: { ...data, devices: [] },
      message: "Room created.",
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const DELETE = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user, token: accessToken } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: RemoveRoomSchema, object: body });

    const data = await removeRoom(params, user.id, accessToken);

    return APIResponse.fromData({
      data,
      message: "Room removed.",
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
