import axios from "axios";
import { ZkAppTransaction } from "./Interface";
import { BLOCKBERRY_API_BASE, BLOCKBERRY_API_KEY } from "./config.js";
import { fetchRecentZkAppTransactions, fetchZkAppTransactionByHash, formatZkAppTransaction } from "./helper.js";


const main = async () => {
    try {
        const transactions = await fetchRecentZkAppTransactions();
        
        if (!transactions || transactions.length === 0) {
            console.log("No recent zkApp transactions found.")                
        }

        const txSummaries = transactions!.map(tx => {
            return formatZkAppTransaction(tx, false) + "\n";
        });
  
        console.log(txSummaries.join('\n\n'));

        const transaction = await fetchZkAppTransactionByHash(transactions![0].hash!)
        if (!transaction) {
            console.log("No zkApp transaction with that hash was found.")                
        }
        //console.log(transaction)
        const formattedTxn = formatZkAppTransaction(transaction!, false)
        console.log(formattedTxn)
    } catch (error) {
        console.error(error)
    }
}

main()