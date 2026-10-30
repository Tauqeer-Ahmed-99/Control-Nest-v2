import z from "zod";

export const CreateRoomSchema = z.object({
  houseId: z
    .uuidv4()
    .nonempty({ error: "Valid houseId is required." })
    .nonoptional({ error: "Valid houseId is required." }),
  roomName: z
    .string()
    .nonempty({ error: "roomName is required." })
    .nonoptional({ error: "roomName is required." }),
});

export const RemoveRoomSchema = z.object({
  houseId: z
    .uuidv4()
    .nonempty({ error: "Valid houseId is required." })
    .nonoptional({ error: "Valid houseId is required." }),
  roomId: z
    .uuidv4()
    .nonempty({ error: "Valid roomId is required." })
    .nonoptional({ error: "Valid roomId is required." }),
});
