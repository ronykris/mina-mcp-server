export interface ZkAppTransaction {
  age: number;
  status: string;
  updatedAccounts: UpdatedAccount[];
  updatesCount: number;
  proverAddress: string;
  proverName: string;
  proverImg: string;
  isZkappAccount: boolean;
  hash?: string;
  txHash?: string;
  fee: number;
  memo: string;
  nonce: number;
  isAccountHijack: boolean;
  proverScam?: AccountScam;
  blockHeight?: number;
  dateTime?: string;
  failureReason?: string;
  zkappCommand?: {
      feePayer?: {
          body?: {
              publicKey?: string;
              fee?: string;
              nonce?: number;
          }
      };
      accountUpdates?: Array<{
          body?: {
              publicKey?: string;
              update?: {
                  appState?: string[];
              }
          }
      }>;
  };
}

interface UpdatedAccount {
  accountAddress: string;
  accountName: string;
  accountImg: string;
  isZkappAccount: boolean;
  verificationKey: string;
  verificationKeyHash: string;
  accountScam?: AccountScam;
}
interface AccountScam {
  scamId: number;
  objectType: string;
  onchainId: string;
  defaultSecurityMessage: string;
  securityMessage: string;
  scamType: string;
}