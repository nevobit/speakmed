export const alertOverrideConflict = (
  originalObject: Record<string, unknown>,
  overridingObject: Record<string, unknown>,
  alertFn: (message: string) => void,
) => {
  Object.entries(overridingObject).forEach(
    ([overridingKey, overridingValue]: [unknown, unknown]) => {
      const originalValue = originalObject[overridingKey as keyof typeof originalObject];

      if (originalValue && overridingValue !== originalValue) {
        alertFn(`overriding object has key "${overridingKey}" with value "${overridingValue}" which will override original object value "${originalValue}"`);
      }
    },
  );
};