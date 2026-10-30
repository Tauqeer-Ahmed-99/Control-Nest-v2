export enum HeaderPinType {
  POWER = "POWER",
  GPIO = "GPIO",
  GROUND = "GROUND",
}

export enum Voltage {
  FIVE = "5v",
  THREE = "3v3",
}

interface HeaderPinConfigBase {
  headerPinNumber: number;
}

export type HeaderPinConfig =
  | (HeaderPinConfigBase & {
      type: HeaderPinType.GPIO;
      gpioPinNumber: number;
      voltage: null;
    })
  | (HeaderPinConfigBase & {
      type: HeaderPinType.POWER;
      gpioPinNumber: null;
      voltage: Voltage;
    })
  | (HeaderPinConfigBase & {
      type: HeaderPinType.GROUND;
      gpioPinNumber: null;
      voltage: null;
    });

export const pinHeaderConfig: HeaderPinConfig[] = [
  {
    headerPinNumber: 1,
    gpioPinNumber: null,
    type: HeaderPinType.POWER,
    voltage: Voltage.THREE,
  },
  {
    headerPinNumber: 2,
    gpioPinNumber: null,
    type: HeaderPinType.POWER,
    voltage: Voltage.FIVE,
  },
  {
    headerPinNumber: 3,
    gpioPinNumber: 2,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 4,
    gpioPinNumber: null,
    type: HeaderPinType.POWER,
    voltage: Voltage.FIVE,
  },
  {
    headerPinNumber: 5,
    gpioPinNumber: 3,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 6,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 7,
    gpioPinNumber: 4,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 8,
    gpioPinNumber: 14,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 9,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 10,
    gpioPinNumber: 15,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 11,
    gpioPinNumber: 17,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 12,
    gpioPinNumber: 18,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 13,
    gpioPinNumber: 27,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 14,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 15,
    gpioPinNumber: 22,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 16,
    gpioPinNumber: 23,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 17,
    gpioPinNumber: null,
    type: HeaderPinType.POWER,
    voltage: Voltage.THREE,
  },
  {
    headerPinNumber: 18,
    gpioPinNumber: 24,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 19,
    gpioPinNumber: 10,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 20,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 21,
    gpioPinNumber: 9,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 22,
    gpioPinNumber: 25,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 23,
    gpioPinNumber: 11,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 24,
    gpioPinNumber: 8,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 25,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 26,
    gpioPinNumber: 7,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 27,
    gpioPinNumber: 0,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 28,
    gpioPinNumber: 1,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 29,
    gpioPinNumber: 5,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 30,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 31,
    gpioPinNumber: 6,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 32,
    gpioPinNumber: 12,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 33,
    gpioPinNumber: 13,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 34,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 35,
    gpioPinNumber: 19,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 36,
    gpioPinNumber: 16,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 37,
    gpioPinNumber: 26,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 38,
    gpioPinNumber: 20,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
  {
    headerPinNumber: 39,
    gpioPinNumber: null,
    type: HeaderPinType.GROUND,
    voltage: null,
  },
  {
    headerPinNumber: 40,
    gpioPinNumber: 21,
    type: HeaderPinType.GPIO,
    voltage: null,
  },
];
