export type UserHouse = { id: string; name: string; isAdmin: boolean };
export type HouseController = {
  id: string;
  houseId: string;
  name: string;
  paired: boolean;
  apiKeyLastFour: string | null;
  tunnel: { hostname: string } | null;
};
