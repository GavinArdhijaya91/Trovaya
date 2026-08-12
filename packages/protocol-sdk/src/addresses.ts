export interface ProtocolAddresses {
  trovayaIPNFT: `0x${string}`;
  trovayaVault: `0x${string}`;
  mockZKHumanVerifier?: `0x${string}`;
}

export type AddressBook = Partial<Record<number, ProtocolAddresses>>;
