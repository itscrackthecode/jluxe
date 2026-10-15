export type PropertyAvailabilityValue = 'AVAILABLE' | 'LIMITED' | 'COMING_SOON' | 'RESERVED' | 'SOLD_OUT' | 'UNAVAILABLE';

const unavailableValues = new Set<PropertyAvailabilityValue>(['SOLD_OUT', 'UNAVAILABLE']);

export function isPropertyOptionEnquirable(availability: PropertyAvailabilityValue | string) {
  return !unavailableValues.has(availability as PropertyAvailabilityValue);
}

export function summarizePropertyAvailability(values: readonly (PropertyAvailabilityValue | string)[]): PropertyAvailabilityValue {
  if (values.includes('AVAILABLE')) return 'AVAILABLE';
  if (values.includes('LIMITED')) return 'LIMITED';
  if (values.includes('COMING_SOON')) return 'COMING_SOON';
  if (values.includes('RESERVED')) return 'RESERVED';
  if (values.includes('SOLD_OUT')) return 'SOLD_OUT';
  return 'UNAVAILABLE';
}

export function getConfigurationAvailability(
  configuration: { id: string; availability: PropertyAvailabilityValue | string },
  inventory: readonly { configurationId: string | null; availability: PropertyAvailabilityValue | string }[],
): PropertyAvailabilityValue {
  const units = inventory.filter((item) => item.configurationId === configuration.id);
  return units.length
    ? summarizePropertyAvailability(units.map((item) => item.availability))
    : configuration.availability as PropertyAvailabilityValue;
}

export function applyConfigurationAvailability<T extends { id: string; availability: PropertyAvailabilityValue | string }>(
  configurations: readonly T[],
  inventory: readonly { configurationId: string | null; availability: PropertyAvailabilityValue | string }[],
): Array<Omit<T, 'availability'> & { availability: PropertyAvailabilityValue }> {
  const unitsByConfiguration = new Map<string, PropertyAvailabilityValue[]>();
  for (const item of inventory) {
    if (!item.configurationId) continue;
    const units = unitsByConfiguration.get(item.configurationId) ?? [];
    units.push(item.availability as PropertyAvailabilityValue);
    unitsByConfiguration.set(item.configurationId, units);
  }
  return configurations.map((configuration) => {
    const units = unitsByConfiguration.get(configuration.id);
    return {
      ...configuration,
      availability: units?.length ? summarizePropertyAvailability(units) : configuration.availability as PropertyAvailabilityValue,
    };
  });
}

export function getPropertyAvailability(
  propertyAvailability: PropertyAvailabilityValue | string,
  configurations: readonly { id: string; availability: PropertyAvailabilityValue | string }[],
  inventory: readonly { configurationId: string | null; availability: PropertyAvailabilityValue | string }[],
): PropertyAvailabilityValue {
  if (!configurations.length && !inventory.length) return propertyAvailability as PropertyAvailabilityValue;

  const tracked = applyConfigurationAvailability(configurations, inventory).map((configuration) => configuration.availability);
  tracked.push(...inventory.filter((item) => item.configurationId === null).map((item) => item.availability as PropertyAvailabilityValue));
  return summarizePropertyAvailability(tracked);
}
