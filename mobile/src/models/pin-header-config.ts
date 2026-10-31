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

export type GPIOPinConfig = Extract<
  HeaderPinConfig,
  { type: HeaderPinType.GPIO }
>;
