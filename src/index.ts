import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import { ZkAppTransaction } from "./Interface";

dotenv.config();

const BLOCKBERRY_API_KEY = process.env.BLOCKBERRY_API_KEY || "";
if (!BLOCKBERRY_API_KEY) {
    console.error("Warning: BLOCKBERRY_API_KEY not set. zkApp transaction queries will fail.");
}

const BLOCKBERRY_API_BASE = "https://api.blockberry.one/mina-mainnet/v1";
const USER_AGENT = "mina-mcp-server/1.0";

const server = new McpServer({
    name: "mina-blockchain",
    version: "1.0.0",
});

const fetchZkAppTransactionByHash = async (txHash: string): Promise<ZkAppTransaction | null> => {
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


const fetchRecentZkAppTransactions = async (
    limit: number = 5, 
    accountId?: string
): Promise<ZkAppTransaction[] | null> => {
    try {    
        const url = new URL(`${BLOCKBERRY_API_BASE}/zkapps/txs`);
        url.searchParams.append("limit", limit.toString());
        if (accountId) {
            url.searchParams.append("account", accountId);
        }
    
        const response = await axios.get(url.toString(), {
            headers: {
                "Accept": "application/json",
                "x-api-key": BLOCKBERRY_API_KEY
            }
        });
        return response.data.items as ZkAppTransaction[];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching recent zkApp transactions: ${error.message}`, error.response?.data);
        } else {
            console.error(`Error fetching recent zkApp transactions: ${(error as Error).message}`);
        }
            return null;
    }
}


const formatZkAppTransaction = (tx: ZkAppTransaction): string => {
    if (!tx) return "No transaction data available";
  
    try {
        const hash = tx.hash || "Unknown";
        const blockHeight = tx.blockHeight || "Unknown";
        const dateTime = tx.dateTime ? new Date(tx.dateTime).toLocaleString() : "Unknown";
        const status = tx.status || "Unknown";
        const failureReason = tx.failureReason || "";
    
    
        const feePayer = tx.zkappCommand?.feePayer?.body?.publicKey || "Unknown";
        const fee = tx.zkappCommand?.feePayer?.body?.fee || "Unknown";
        const nonce = tx.zkappCommand?.feePayer?.body?.nonce || "Unknown";
    
    
        const accountUpdates = tx.zkappCommand?.accountUpdates || [];
        const formattedAccountUpdates = accountUpdates.map((update, index) => {
            const publicKey = update.body?.publicKey || "Unknown";
            const appStates = update.body?.update?.appState || [];
            const formattedStates = appStates.map((state, idx) => 
                `    - State[${idx}]: ${state}`
                ).join('\n');
      
            return `  Account Update #${index + 1}:\n    Public Key: ${publicKey}\n    App States:\n${formattedStates}`;
        }).join('\n\n');
    
        return [
            `Transaction Hash: ${hash}`,
            `Block Height: ${blockHeight}`,
            `Date: ${dateTime}`,
            `Status: ${status}${failureReason ? ` (Failure: ${failureReason})` : ''}`,
            `Fee Payer: ${feePayer}`,
            `Fee: ${fee} MINA`,
            `Nonce: ${nonce}`,
            `\nAccount Updates:`,
            formattedAccountUpdates || "  No account updates found"
        ].join('\n');
    } catch (error) {
        console.error("Error formatting zkApp transaction:", error);
        return "Error formatting transaction data: " + (error as Error).message;
    }
}

server.tool(
    "get-zkapp-transaction",
    "Get details of a specific zkApp transaction by its hash",
    {
        txHash: z.string().describe("Transaction hash of the zkApp transaction"),
    },
    async ({ txHash }) => {
        if (!BLOCKBERRY_API_KEY) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Blockberry API key not configured. Please set the BLOCKBERRY_API_KEY environment variable.",
                    },
                ],
            };
        }

        try {
            const transaction = await fetchZkAppTransactionByHash(txHash);
      
            if (!transaction) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `No zkApp transaction found with hash ${txHash}.`,
                        },
                    ],
                };
            }
      
            const formattedTx = formatZkAppTransaction(transaction);
      
            return {
                content: [
                    {
                        type: "text",
                        text: `zkApp Transaction Details:\n\n${formattedTx}`,
                    },
                ],
            };
        } catch (error) {
            console.error("Error fetching zkApp transaction:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching zkApp transaction: ${(error as Error).message}`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-recent-zkapp-transactions",
    "Get recent zkApp transactions on the Mina network",
    {
        limit: z.number().int().min(1).max(20).default(5).describe("Number of transactions to return (max: 20)"),
        accountId: z.string().optional().describe("Filter by account ID (optional)"),
    },
    async ({ limit, accountId }) => {
        if (!BLOCKBERRY_API_KEY) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Blockberry API key not configured. Please set the BLOCKBERRY_API_KEY environment variable.",
                    },
                ],
            };
        }

        try {
            const transactions = await fetchRecentZkAppTransactions(limit, accountId);
      
            if (!transactions || transactions.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: accountId 
                                ? `No zkApp transactions found for account ${accountId}.`
                                : "No recent zkApp transactions found.",
                        },
                    ],
                };
            }      
      
            const txSummaries = transactions.map(tx => {
                const feePayer = tx.zkappCommand?.feePayer?.body?.publicKey || "Unknown";
                const accountUpdates = tx.zkappCommand?.accountUpdates || [];
                const updatedAccounts = accountUpdates.map(update => update.body?.publicKey || "Unknown").join(", ");
        
                return [
                    `Hash: ${tx.hash}`,
                    `Block: ${tx.blockHeight}`,
                    `Date: ${tx.dateTime ? new Date(tx.dateTime).toLocaleString() : "Unknown"}`,
                    `Status: ${tx.status}${tx.failureReason ? ` (Failure: ${tx.failureReason})` : ""}`,
                    `Fee Payer: ${feePayer}`,
                    `Updated Accounts: ${updatedAccounts || "None"}`,
                        "---"
                ].join("\n");
            });
      
            return {
                content: [
                    {
                        type: "text",
                        text: `Recent zkApp Transactions${accountId ? ` for ${accountId}` : ""}:\n\n${txSummaries.join("\n")}`,
                    },
                ],
            };
        } catch (error) {
            console.error("Error fetching zkApp transactions:", error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching zkApp transactions: ${(error as Error).message}`,
                    },
                ],
            };
        }
    }
);

const main = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Mina MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});