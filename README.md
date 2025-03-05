# Mina MCP Server

A Model Context Protocol (MCP) server that provides zkApp transaction information from the Mina blockchain.

## Overview

This MCP server provides AI models with the ability to query and retrieve information about zkApp transactions on the Mina blockchain. It uses the Blockberry API to fetch transaction data and formats it for easy consumption.

The server implements the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/spec), which allows AI models like Claude to access external tools and data sources. When connected to an MCP-compatible client like Claude Desktop, this server enables the AI to provide real-time information about zkApp transactions on the Mina blockchain.

## Features

- Query specific zkApp transactions by transaction hash
- Fetch recent zkApp transactions with pagination support
- Filter transactions by account ID
- Detailed transaction formatting including:
  - Transaction status and block height
  - Fee payer/prover information
  - Updated accounts and their state changes
  - Security warnings for potentially suspicious transactions
  - Balance changes and timestamp information

## Demo
 
 [Talk to the mina blokchain!](./mina-mcp-server.mp4)

## Prerequisites

- A Blockberry API key (sign up at [Blockberry](https://blockberry.one))
- Claude Desktop or another MCP-compatible client

## Usage

## Using with Claude Desktop

To use the Mina MCP server with Claude Desktop (Anthropic's desktop app for Claude), follow these steps:

1. **Download and Install Claude Desktop:**
   * **macOS/Windows:** Visit the official Claude Desktop downloads page and get the app for your operating system. Install the app and ensure you're using the latest version (you can check for updates in the app menu).
   * **Linux:** While Anthropic doesn't officially support Linux yet, you can use the community-maintained version available at [https://github.com/aaddrick/claude-desktop-debian](https://github.com/aaddrick/claude-desktop-debian).

2. **Configure Claude Desktop to use the Mina MCP Server:** Open the Claude Desktop configuration file (it's created when you first edit settings in Claude Desktop):
   * **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   * **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   * **Linux:** This will depend on the installation method, but is likely in `~/.config/Claude/claude_desktop_config.json`

   Add an entry for the Mina MCP server in this JSON config under the `"mcpServers"` section:

   ```json
   {
     "mcpServers": {
       "mina-mcp": {
         "command": "bash",
         "args": [
            "-c", "BLOCKBERRY_API_KEY=your_api_key npx mina-mcp-server"
            ]         
       }
     }
   }
   ```

   In this configuration:
   - `"mina-mcp"` is an identifier for the server
   - The `command` is set to run the `bash` command
   - `args` tells npx to run the latest version of the mina-mcp package while setting the blockberry api key as an env variable

## Available Tools

### get-zkapp-transaction

Get detailed information about a specific zkApp transaction by its hash.

Parameters:
- `txHash` (string): The transaction hash to lookup

Example:
```json
{
  "name": "get-zkapp-transaction",
  "parameters": {
    "txHash": "5JtRyvAiXf7mXB5JsWuUVYsBYPDPwP55JCAPR2cDG8yRb1Pc3q8T"
  }
}
```

### get-recent-zkapp-transactions

Fetches a list of recent zkApp transactions with pagination support.

Parameters:
- `page` (number, default: 0): Page number (starts at 0)
- `size` (number, default: 20): Number of transactions per page (max: 50)
- `accountId` (string, optional): Filter by account ID
- `orderBy` (enum: "ASC" or "DESC", default: "DESC"): Sorting direction
- `sortBy` (string, default: "AGE"): Sorting parameter

Example:
```json
{
  "name": "get-recent-zkapp-transactions",
  "parameters": {
    "page": 0,
    "size": 10,
    "orderBy": "DESC",
    "sortBy": "AGE"
  }
}
```

## Credits

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Transaction data provided by [Blockberry API](https://blockberry.one)
- Influenced by [Bitcoin MCP Server](https://github.com/AbdelStark/bitcoin-mcp)