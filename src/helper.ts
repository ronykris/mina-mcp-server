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

export const formatZkAppTransaction = (tx: any, verbose: boolean = true): string => {
    if (!tx) return "No transaction data available";
  
    try {
        const isSingleTxResponse = !!tx.txHash && tx.updatedAccounts && Array.isArray(tx.updatedAccounts);
        const isListResponse = tx.age !== undefined && tx.updatedAccounts && Array.isArray(tx.updatedAccounts);
        const isLegacyResponse = tx.zkappCommand && tx.zkappCommand.accountUpdates;
        
        // Basic transaction info
        const txHash = tx.txHash || tx.hash || "Unknown";
        const blockHeight = tx.blockHeight || "Unknown";
        
        // Status field differs between formats
        const status = tx.txStatus || tx.status || "Unknown";
        
        // Time/age representation differs between formats
        let timeDisplay = "";
        if (tx.timestamp) {
            timeDisplay = `Timestamp: ${new Date(tx.timestamp).toLocaleString()}`;
        } else if (tx.dateTime) {
            timeDisplay = `Date: ${new Date(tx.dateTime).toLocaleString()}`;
        } else if (tx.age !== undefined) {
            timeDisplay = `Age: ${typeof tx.age === 'number' ? `${tx.age} seconds ago` : tx.age}`;
        } else {
            timeDisplay = "Time: Unknown";
        }
        
        // Confirmation info only in single tx response
        const confirmations = tx.blockConfirmationsCount !== undefined 
            ? ` (${tx.blockConfirmationsCount} confirmations)` 
            : "";
        
        // Fee information
        const fee = tx.fee !== undefined ? `${tx.fee} MINA` : "Unknown";
        const feeUsd = tx.feeUsd !== undefined ? ` ($${tx.feeUsd})` : "";
        
        // Transaction metadata
        const nonce = tx.nonce !== undefined ? tx.nonce : "Unknown";
        const memo = tx.memo || "None";
        
        // Fee payer/Prover information
        let payerInfo = "";
        if (tx.feePayerAddress) {
            // Single tx response format
            const feePayerName = tx.feePayerName || "";
            payerInfo = feePayerName 
                ? `Fee Payer: ${feePayerName} (${tx.feePayerAddress})`
                : `Fee Payer: ${tx.feePayerAddress}`;
        } else if (tx.proverAddress) {
            // List response format
            const proverName = tx.proverName || "";
            payerInfo = proverName 
                ? `Prover: ${proverName} (${tx.proverAddress})`
                : `Prover: ${tx.proverAddress}`;
        } else if (isLegacyResponse && tx.zkappCommand?.feePayer?.body?.publicKey) {
            // Legacy response format
            payerInfo = `Fee Payer: ${tx.zkappCommand.feePayer.body.publicKey}`;
        } else {
            payerInfo = "Fee Payer: Unknown";
        }
        
        // Failure information varies by format
        let failureInfo = "";
        if (tx.failures && tx.failures.length > 0) {
            // Single tx format
            failureInfo = `\nFailures (${tx.failures.length}):\n${tx.failures.map((f: any, i: number) => 
                `  #${i+1}: Index ${f.index}, Reason: ${f.failureReason}`
            ).join('\n')}`;
        } else if (tx.failureReason) {
            // Legacy or simple failure reason
            failureInfo = `\nFailure: ${tx.failureReason}`;
        } else if (status.toLowerCase() === 'failed' || status.toLowerCase().includes('error')) {
            // Status indicates failure but no specific reason
            failureInfo = '\nTransaction failed, but no specific failure reason provided';
        }
        
        // Total balance changes
        let balanceChangeInfo = "";
        if (tx.totalBalanceChange !== undefined) {
            balanceChangeInfo = `\nTotal Balance Change: ${tx.totalBalanceChange} MINA` +
                (tx.totalBalanceChangeUsd !== undefined ? ` ($${tx.totalBalanceChangeUsd})` : "");
        }
        
        // Security warnings
        const securityWarnings = [];
        if (tx.isAccountHijack === true) {
            securityWarnings.push("⚠️ Possible account hijacking detected");
        }
        if (tx.proverScam) {
            securityWarnings.push(`⚠️ Prover security: ${tx.proverScam.securityMessage || tx.proverScam.defaultSecurityMessage}`);
        }
        const securityWarningsText = securityWarnings.length > 0 
            ? `\nSecurity Warnings:\n${securityWarnings.join('\n')}`
            : "";
        
        // If verbose is false, return a concise summary (for lists)
        if (!verbose) {
            const conciseSummary = [
                `Transaction Hash: ${txHash}`,
                `Block Height: ${blockHeight}${confirmations}`,
                `Status: ${status}`,
                timeDisplay,
                payerInfo,
                `Fee: ${fee}${feeUsd}`,
                securityWarnings.length > 0 ? `Security: ${securityWarnings.join(", ")}` : "",
                tx.totalBalanceChange !== undefined ? `Balance Change: ${tx.totalBalanceChange} MINA` : "",
                status.toLowerCase() === 'failed' ? "❌ Transaction failed" : ""
            ].filter(line => line).join("\n");
            
            return conciseSummary;
        }
        
        // Account updates section for verbose mode - handle different formats
        let accountUpdatesText = "";
        
        if (isSingleTxResponse && tx.updatedAccounts && tx.updatedAccounts.length > 0) {
            // Format for single transaction response
            const formattedAccounts = tx.updatedAccounts.map((account: any, index: number) => {
                const isZkApp = account.isZkappAccount ? " (zkApp)" : "";
                const name = account.accountName ? `${account.accountName}${isZkApp}` : `Account${isZkApp}`;
                const balanceChange = account.totalBalanceChange !== undefined
                    ? `\n    Balance Change: ${account.totalBalanceChange} MINA` +
                      (account.totalBalanceChangeUsd !== undefined ? ` ($${account.totalBalanceChangeUsd})` : "")
                    : "";
                const tokenInfo = account.tokenId
                    ? `\n    Token ID: ${account.tokenId}`
                    : "";
                const callInfo = account.callData && account.callData !== "0"
                    ? `\n    Call Data: ${account.callData}`
                    : "";
                const callDepth = account.callDepth !== undefined 
                    ? `\n    Call Depth: ${account.callDepth}`
                    : "";
                const scamWarning = account.accountScam && (account.accountScam.securityMessage || account.accountScam.defaultSecurityMessage)
                    ? `\n    ⚠️ Security Warning: ${account.accountScam.securityMessage || account.accountScam.defaultSecurityMessage}`
                    : "";
                
                // App state updates
                let appStateUpdates = "";
                if (account.update?.appState && account.update.appState.length > 0) {
                    const stateUpdates = account.update.appState
                        .map((state: string, idx: number) => state ? `      State[${idx}]: ${state}` : null)
                        .filter(Boolean)
                        .join('\n');
                    
                    if (stateUpdates) {
                        appStateUpdates = `\n    App State Updates:\n${stateUpdates}`;
                    }
                }
                
                // Check for failures related to this account/index
                let accountFailures = "";
                if (tx.failures && tx.failures.length > 0) {
                    const relevantFailures = tx.failures.filter((f: any) => f.index === index);
                    if (relevantFailures.length > 0) {
                        accountFailures = `\n    ❌ Failures: ${relevantFailures.map((f: any) => f.failureReason).join(', ')}`;
                    }
                }
                
                return `  Update #${index + 1}: ${name}\n    Address: ${account.accountAddress}${balanceChange}${tokenInfo}${callInfo}${callDepth}${appStateUpdates}${scamWarning}${accountFailures}`;
            }).join('\n\n');
            
            accountUpdatesText = `\nUpdated Accounts (${tx.updatedAccountsCount || tx.updatedAccounts.length}):\n${formattedAccounts}`;
        } else if (isListResponse && tx.updatedAccounts && tx.updatedAccounts.length > 0) {
            // Format for list response
            const updatedAccountsInfo = tx.updatedAccounts.map((acc: any) => {
                const name = acc.accountName || acc.accountAddress;
                const isZkApp = acc.isZkappAccount ? " (zkApp)" : "";
                const scamWarning = acc.accountScam && (acc.accountScam.securityMessage || acc.accountScam.defaultSecurityMessage)
                    ? ` ⚠️ ${acc.accountScam.securityMessage || acc.accountScam.defaultSecurityMessage}`
                    : "";
                return `${name}${isZkApp}${scamWarning}`;
            }).join(", ");
            
            accountUpdatesText = `\nUpdated Accounts (${tx.updatesCount || tx.updatedAccounts.length}):\n  ${updatedAccountsInfo}`;
        } else if (isLegacyResponse && tx.zkappCommand?.accountUpdates) {
            // Format for legacy response
            const formattedAccountUpdates = tx.zkappCommand.accountUpdates.map((update: any, index: number) => {
                const publicKey = update.body?.publicKey || "Unknown";
                const appStates = update.body?.update?.appState || [];
                const formattedStates = appStates.map((state: string, idx: number) => 
                    `    - State[${idx}]: ${state}`
                ).join('\n');
          
                return `  Account Update #${index + 1}:\n    Public Key: ${publicKey}\n    App States:\n${formattedStates}`;
            }).join('\n\n');
            
            accountUpdatesText = `\nAccount Updates:\n${formattedAccountUpdates || "  No account updates found"}`;
        }
        
        // Combine all sections for verbose output
        return [
            `Transaction Hash: ${txHash}`,
            `Block Height: ${blockHeight}${confirmations}`,
            `Status: ${status}`,
            timeDisplay,
            payerInfo,
            `Fee: ${fee}${feeUsd}`,
            `Nonce: ${nonce}`,
            `Memo: ${memo}`,
            securityWarningsText,
            failureInfo,
            balanceChangeInfo,
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