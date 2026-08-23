export function isDeliveryEligible(input: { licensed: boolean; authorized: boolean; keyActive: boolean }): boolean {
  return input.licensed && input.authorized && input.keyActive;
}
