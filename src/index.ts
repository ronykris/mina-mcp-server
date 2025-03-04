#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import { ZkAppTransaction } from "./Interface.js";
import { BLOCKBERRY_API_BASE, BLOCKBERRY_API_KEY } from "./config.js";
import { fetchRecentZkAppTransactions, formatZkAppTransaction } from "./helper.js";
import { Command } from 'commander';

dotenv.config();

const program = new Command();

program
  .name('mina-mcp')
  .description('Mina Blockchain MCP Server')
  .option('-k, --api-key <key>', 'Blockberry API key')

program.parse(process.argv);

const options = program.opts();

if (options.apiKey) {
    process.env.BLOCKBERRY_API_KEY = options.apiKey;
}

if (!BLOCKBERRY_API_KEY) {
    console.error("Warning: BLOCKBERRY_API_KEY not set. zkApp transaction queries will fail.");
}

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
                        text: "Error 123: Blockberry API key not configured. Please set the BLOCKBERRY_API_KEY environment variable.",
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
        page: z.number().int().min(0).default(0).describe("Page number (starts at 0)"),
        size: z.number().int().min(1).max(50).default(20).describe("Number of transactions per page (max: 50)"),
        accountId: z.string().optional().describe("Filter by account ID (optional)"),
        orderBy: z.enum(["ASC", "DESC"]).default("DESC").describe("Sorting direction (ASC or DESC)"),
        sortBy: z.string().default("AGE").describe("Sorting parameter (default: AGE)")
    },
    async ({ page, size, accountId, orderBy, sortBy }) => {
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
            const transactions = await fetchRecentZkAppTransactions(page, size, orderBy, sortBy, accountId);
      
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
                return formatZkAppTransaction(tx, false) + "\n";
            });
      
            return {
                content: [
                    {
                        type: "text",
                        text: `Recent zkApp Transactions${accountId ? ` for ${accountId}` : ""}:\nPage ${page + 1}, ${transactions.length} results\n\n${txSummaries.join("\n\n")}`,
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