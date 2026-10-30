export type EnergyUnit = "kWh" | "Wh";

export type EnergyConsumptionData = {
  houseId: string;
  period: {
    startDate: string;
    endDate: string;
    endExclusive: boolean;
  };
  unit: EnergyUnit;
  totalConsumption: number;
  totalWh: number;
  totalKwh: number;
  devices: {
    deviceId: string;
    energyWh: number;
    energyKwh: number;
    consumption: number;
  }[];
};
