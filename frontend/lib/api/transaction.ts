import axios from 'axios';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

// 创建交易记录
export async function createTransaction(datasetId: number, amount: number): Promise<{ id: number }> {
  const res = await axios.post(`${BASE_URL}/transaction/create`, { datasetId: datasetId, amount: amount }, { withCredentials: true });
  if (res.data.code === 201) {
    return { id: res.data.data.transactionId };
  } else {
    throw new Error(res.data.msg || '创建交易记录失败');
  }
}

// 更新交易记录
export async function updateTransaction(update: { id: number; txHash: string; blockHash: string; blockNumber: number; gas: string; status: string; nonce: number; blockTimestamp: number }): Promise<void> {
  const res = await axios.post(`${BASE_URL}/transaction/confirm`, update, { withCredentials: true });
  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '更新交易记录失败');
  }
}

// 删除交易记录
export async function deleteTransaction(id: number): Promise<void> {
  const res = await axios.delete(`${BASE_URL}/transaction/delete-transaction/${id}`, { withCredentials: true });
  console.log("deleteTransaction = ", res);
  if (res.data.code !== 204) {
    throw new Error(res.data.msg || '删除交易记录失败');
  }
}
