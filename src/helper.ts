import axios from "axios";
import { ZkAppTransaction } from "./Interface.js";
import { BLOCKBERRY_API_BASE, BLOCKBERRY_API_KEY } from "./config.js";

export const fetchRecentZkAppTransactions = async (
    page: number = 0,
    size: number = 20,
    orderBy: "ASC" | "DESC" = "DESC",
    sortBy: string = "AGE",
    accountId?: string
): Promise<ZkAppTransaction[] | null> => {
    try {    
        const url = new URL(`${BLOCKBERRY_API_BASE}/zkapps/txs`);
        
        // Required parameters
        url.searchParams.append("page", page.toString());
        url.searchParams.append("size", size.toString());
        url.searchParams.append("orderBy", orderBy);
        url.searchParams.append("sortBy", sortBy);
        
        // Optional account filter
        if (accountId) {
            url.searchParams.append("account", accountId);
        }
    
        const response = await axios.get(url.toString(), {
            headers: {
                "Accept": "application/json",
                "x-api-key": BLOCKBERRY_API_KEY
            }
        });
        
        return response.data.data as ZkAppTransaction[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching recent zkApp transactions: ${error.message}`, error.response?.data);
        } else {
            console.error(`Error fetching recent zkApp transactions: ${(error as Error).message}`);
        }
        return null;
    }
}

export const formatZkAppTransaction = (tx: ZkAppTransaction, verbose: boolean = true): string => {
    if (!tx) return "No transaction data available";
    
    try {
        const hash = tx.txHash || tx.hash || "Unknown";
        const status = tx.status || "Unknown";
        const age = tx.age || "Unknown";
        const fee = tx.fee !== undefined ? `${tx.fee} MINA` : "Unknown";
        const nonce = tx.nonce || "Unknown";
        const memo = tx.memo || "None";
        
        // Prover/Fee Payer information
        const proverInfo = tx.proverName
            ? `${tx.proverName} (${tx.proverAddress})`
            : tx.proverAddress || "Unknown";
        
        // Account updates information
        const updatedAccountsCount = tx.updatesCount || tx.updatedAccounts?.length || 0;
        
        // Security warnings
        const securityWarnings = [];
        if (tx.isAccountHijack) {
            securityWarnings.push("⚠️ Possible account hijacking detected");
        }
        if (tx.proverScam) {
            securityWarnings.push(`⚠️ Prover security: ${tx.proverScam.securityMessage || tx.proverScam.defaultSecurityMessage}`);
        }
        if (tx.updatedAccounts?.some(acc => acc.accountScam)) {
            securityWarnings.push("⚠️ Updated account security concern");
        }
        
        // If verbose is false, return a concise summary (for lists of transactions)
        if (!verbose) {
            const updatedAccountsInfo = tx.updatedAccounts && tx.updatedAccounts.length > 0
                ? tx.updatedAccounts.map(acc => acc.accountName || acc.accountAddress).join(", ")
                : "None";
            
            const securityWarningsText = securityWarnings.length > 0
                ? `Security: ${securityWarnings.join(", ")}`
                : "";
            
            return [
                `Hash: ${hash}`,
                `Age: ${typeof age === 'number' ? `${age} seconds ago` : age}`,
                `Status: ${status}`,
                `Prover: ${proverInfo}`,
                `Fee: ${fee}`,
                `Updated Accounts (${updatedAccountsCount}): ${updatedAccountsInfo}`,
                securityWarningsText
            ].filter(line => line && !line.endsWith(": ")).join("\n");
        }
        
        // For verbose mode (default), return detailed information
        // Account updates section
        const updatedAccounts = tx.updatedAccounts || [];
        let accountUpdatesText = "";
        
        if (updatedAccounts.length > 0) {
            const formattedAccounts = updatedAccounts.map((account, index) => {
                const isZkApp = account.isZkappAccount ? " (zkApp)" : "";
                const name = account.accountName ? `${account.accountName}${isZkApp}` : "Unnamed Account";
                const scamWarning = account.accountScam 
                    ? `\n    ⚠️ Security Warning: ${account.accountScam.securityMessage || account.accountScam.defaultSecurityMessage}`
                    : "";
                
                return `  Account Update #${index + 1}:\n    ${name}: ${account.accountAddress}${scamWarning}`;
            }).join('\n\n');
            
            accountUpdatesText = `\nUpdated Accounts (${updatedAccountsCount}):\n${formattedAccounts}`;
        } else if (tx.zkappCommand?.accountUpdates?.length) {
            // Fallback to old format if present
            const formattedAccountUpdates = tx.zkappCommand.accountUpdates.map((update, index) => {
                const publicKey = update.body?.publicKey || "Unknown";
                const appStates = update.body?.update?.appState || [];
                const formattedStates = appStates.map((state, idx) => 
                    `    - State[${idx}]: ${state}`
                ).join('\n');
          
                return `  Account Update #${index + 1}:\n    Public Key: ${publicKey}\n    App States:\n${formattedStates}`;
            }).join('\n\n');
            
            accountUpdatesText = `\nAccount Updates:\n${formattedAccountUpdates || "  No account updates found"}`;
        } else {
            accountUpdatesText = "\nAccount Updates: None";
        }
        
        const securityWarningsText = securityWarnings.length > 0 
            ? `\nSecurity Warnings:\n${securityWarnings.join('\n')}`
            : "";
        
        return [
            `Transaction Hash: ${hash}`,
            `Status: ${status}`,
            `Age: ${typeof age === 'number' ? `${age} seconds ago` : age}`,
            `Fee: ${fee}`,
            `Prover: ${proverInfo}`,
            `Nonce: ${nonce}`,
            `Memo: ${memo}`,
            securityWarningsText,
            accountUpdatesText
        ].filter(line => line).join('\n');
    } catch (error) {
        console.error("Error formatting zkApp transaction:", error);
        return "Error formatting transaction data: " + (error as Error).message;
    }
}

export const fetchZkAppTransactionByHash = async (txHash: string): Promise<ZkAppTransaction | null> => {
    try {
        const response = await axios.get(
            `${BLOCKBERRY_API_BASE}/zkapps/txs/${txHash}`,
            {
                headers: {
                    "Accept": "application/json",
                    "x-api-key": BLOCKBERRY_API_KEY
                }
            }
        );    
        return response.data as ZkAppTransaction;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching zkApp transaction ${txHash}: ${error.message}`, error.response?.data);
        } else {
            console.error(`Error fetching zkApp transaction ${txHash}: ${(error as Error).message}`);
        }
        return null;
    }
}