import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/api/transaction";
import { getWritableContract, getProvider } from "@/contract/contractConnect";
import { ethers } from "ethers";

export async function purchaseDataset(
  datasetId: number,
  amount: number
): Promise<{ success: boolean }> {
  let transactionId: number | null = null;
  try {
    const { id } = await createTransaction(datasetId, amount);
    transactionId = id;
    const contract = await getWritableContract();
    const tx = await contract.purchaseDataset(datasetId, {
      value: ethers.parseEther(amount.toString()),
    });
    const receipt = await tx.wait();
    // 获取区块时间戳
    const provider = getProvider();
    const block = await provider.getBlock(receipt.blockNumber);
    if (!block) {
      throw new Error("获取区块失败");
    }
    await updateTransaction({
      id: transactionId,
      txHash: tx.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      gas: tx.gasLimit?.toString() || '',
      status: 'completed',
      nonce: tx.nonce,
      blockTimestamp: block.timestamp,
    });
    return { success: true };
  } catch (error) {
    if (transactionId) {
      try { await deleteTransaction(transactionId); } catch {}
    }
    throw error;
  }
}

export function useTransaction() {
  return { purchaseDataset };
}
