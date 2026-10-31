import { APIResponse } from "@/models/api";
import {
  CreateHouseMemberSchema,
  RemoveHouseMemberSchema,
  UpdateHouseMemberSchema,
} from "@/models/house-member";
import { authenticate } from "@/services/auth";
import {
  createHouseMember,
  getHouseMembers,
  removeHouseMember,
  updateHouseMember,
} from "@/services/house";
import { validate } from "@/services/validation";
import { NextRequest } from "next/server";
import { withRequestObservability } from "@/services/request-observability";

export const GET = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const houseId = req.nextUrl.searchParams.get("houseId")!;

    const data = await getHouseMembers({ houseId }, user.id);

    return APIResponse.fromData({ data, message: "House members fetched." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const POST = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: CreateHouseMemberSchema, object: body });

    const data = await createHouseMember(params, user.id);

    return APIResponse.fromData({
      data,
      message: "House member added.",
      statusCode: 201,
    });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const DELETE = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: RemoveHouseMemberSchema, object: body });

    const data = await removeHouseMember(params, user.id);

    return APIResponse.fromData({ data, message: "House member removed." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});

export const PATCH = withRequestObservability(async (req: NextRequest) => {
  try {
    const { user } = await authenticate(req);

    const body = await req.json();

    const params = validate({ schema: UpdateHouseMemberSchema, object: body });

    const data = await updateHouseMember(params, user.id);

    return APIResponse.fromData({ data, message: "House member updated." });
  } catch (error) {
    return APIResponse.fromError(error);
  }
});
