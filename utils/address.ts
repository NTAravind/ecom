export const ADDR_SEP = "|||";

/**
 * Encodes the four address parts into a single string for storage
 * in the existing `Address` DB column.
 *
 * Format: <street>|||<city>|||<state>|||<landmark>
 */
export function encodeAddress(
  street: string,
  city: string,
  state: string,
  landmark: string
): string {
  return [street, city, state, landmark].join(ADDR_SEP);
}

/**
 * Decodes the stored `Address` column value back into its parts.
 * Handles legacy single-field addresses gracefully by placing the
 * entire value in `street` and leaving the rest blank.
 */
export function decodeAddress(raw: string | null | undefined): {
  street: string;
  city: string;
  state: string;
  landmark: string;
} {
  if (!raw) return { street: "", city: "", state: "", landmark: "" };
  const parts = raw.split(ADDR_SEP);
  if (parts.length < 2) {
    // Legacy single-field address — show full value in street
    return { street: raw, city: "", state: "", landmark: "" };
  }
  return {
    street:   parts[0] ?? "",
    city:     parts[1] ?? "",
    state:    parts[2] ?? "",
    landmark: parts[3] ?? "",
  };
}
