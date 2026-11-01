/** Setup decisions shared by the screens; none of these retain credential values. */
export function inspectControllerKey<
  T extends { id: string; houseId: string; name: string },
>(key: string, houseId: string, controllers: T[]) {
  const match =
    /^cn_([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.[A-Za-z0-9_-]{43}$/.exec(
      key.trim(),
    );
  if (!match)
    return {
      controller: null,
      error: "Paste the complete key, starting with cn_.",
    };
  const controller = controllers.find(
    (item) => item.id === match[1] && item.houseId === houseId,
  );
  if (!controller)
    return {
      controller: null,
      error:
        "This key is not listed in this house. Refresh after creating it, or choose the correct house.",
    };
  return { controller, error: "" };
}

export function canRestoreHouse(
  config: { userId?: string; house: { id: string } } | null | undefined,
  userId: string | undefined,
) {
  return Boolean(userId && config?.house.id && config.userId === userId);
}

export function selectAvailablePin<T extends { headerPinNumber: number }>(
  pins: T[],
  controllerId: string | undefined,
  selection: { controllerId: string; number: number } | null,
) {
  return (
    (controllerId && selection?.controllerId === controllerId
      ? pins.find((item) => item.headerPinNumber === selection.number)
      : undefined) ?? pins[0]
  );
}
