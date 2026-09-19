/**
 * Utilities / clearance stub.
 * Architecture: live contact = binary strike; clearance OD/2 + 18 in (Bot 2).
 */
export type UtilityContact = {
  /** True = binary strike (clears clean-pass) */
  strike: boolean
}

export function checkUtilityClearance(_opts?: {
  odIn?: number
  clearanceIn?: number
}): UtilityContact {
  // TODO Bot 2 / collision world
  return { strike: false }
}
