interface Block {
    blockHeight: number;
    stateHash: string;
    canonical: boolean;
    dateTime: string;
    txFees: string;
    snarkFees: string;
    transactions: {
      userCommands: number;
      zkappCommands: number;
      feePayer: number;
    };
    coinbase: string;
    creator: string;
    receivedTime: string;
}
  
interface Account {
    publicKey: string;
    delegate: string;
    balance: {
        total: string;
        liquid: string;
        locked: string;
        unknown: string;
    };
    nonce: number;
    inferredNonce: number;
    receiptChainHash: string;
    delegate_change_block_height: any;
    delegate_change_state_hash: any;
    zkappState: string[];
    index: number;
}
  

interface Transaction {
    blockHeight: number;
    dateTime: string;
    hash: string;
    status: string;
    xAmount: string;
    failureReason: string | null;
    memo: string;
    sender: string;
    receiver: string;
    nonce: number;
    feeAmount: string;
    coinbaseBool: boolean;
}
  

interface ZkAppTransaction {
    hash: string;
    blockHeight: number;
    dateTime: string;
    status: string;
    zkappCommand: {
      feePayer: {
        body: {
          publicKey: string;
          fee: string;
          nonce: number;
        }
      };
      accountUpdates: Array<{
        body: {
          publicKey: string;
          update: {
            appState: string[];
          }
        }
      }>;
    };
    failureReason?: string;
}

export { ZkAppTransaction}