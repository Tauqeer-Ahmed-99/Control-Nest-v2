import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  houses: {
    controllerDevice: r.many.controllerDevices({
      from: r.houses.id,
      to: r.controllerDevices.houseId,
      alias: "House_To_ControllerDevice",
    }),
    houseMembers: r.many.houseMembers({
      from: r.houses.id,
      to: r.houseMembers.houseId,
      alias: "House_To_HouseMembers",
    }),
    rooms: r.many.rooms({
      from: r.houses.id,
      to: r.rooms.houseId,
      alias: "House_To_Rooms",
    }),
  },

  houseMembers: {
    house: r.one.houses({
      from: r.houseMembers.houseId,
      to: r.houses.id,
      alias: "House_To_HouseMembers",
    }),
  },

  controllerDevices: {
    house: r.one.houses({
      from: r.controllerDevices.houseId,
      to: r.houses.id,
      alias: "House_To_ControllerDevice",
    }),
    tunnel: r.one.tunnels({
      from: r.controllerDevices.id,
      to: r.tunnels.controllerDeviceId,
      alias: "ControllerDevice_To_Tunnel",
    }),
  },

  rooms: {
    house: r.one.houses({
      from: r.rooms.houseId,
      to: r.houses.id,
      alias: "House_To_Rooms",
    }),
    devices: r.many.devices({
      from: r.rooms.id,
      to: r.devices.roomId,
      alias: "Rooms_To_Devices",
    }),
  },

  devices: {
    controllerDevice: r.one.controllerDevices({
      from: r.devices.controllerDeviceId,
      to: r.controllerDevices.id,
    }),
    room: r.one.rooms({
      from: r.devices.roomId,
      to: r.rooms.id,
      alias: "Rooms_To_Devices",
    }),
    deviceControlLogs: r.many.deviceControlLogs({
      from: r.devices.id,
      to: r.deviceControlLogs.deviceId,
      alias: "Devices_To_DeviceControlLogs",
    }),
  },

  deviceControlLogs: {
    device: r.one.devices({
      from: r.deviceControlLogs.deviceId,
      to: r.devices.id,
      alias: "Devices_To_DeviceControlLogs",
    }),
  },
}));
