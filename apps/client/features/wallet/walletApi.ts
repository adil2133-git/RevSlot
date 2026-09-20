import api from "@/lib/axios";

export type WalletOverview = {
  wallet: {
    pendingBalance: number; // in paise
    availableBalance: number; // in paise
    withdrawnBalance: number; // in paise
    totalEarnings: number; // in paise
  };
  payoutProfile: {
    payoutMethod: "bank_account" | "upi";
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    isVerified: boolean;
  } | null;
  transactions: Array<{
    id: number;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    availableAt: string | null;
    createdAt: string;
  }>;
  payoutRequests: Array<{
    id: number;
    amount: number;
    status: string;
    transactionReference: string | null;
    requestedAt: string;
    processedAt: string | null;
  }>;
};

export async function fetchWalletOverview(): Promise<WalletOverview> {
  const { data } = await api.get<{ success: boolean; data: WalletOverview }>("/wallet/overview");
  return data.data;
}

export async function savePayoutProfile(payload: {
  payoutMethod: "bank_account" | "upi";
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}) {
  const { data } = await api.post<{ success: boolean; data: any }>("/wallet/payout-profile", payload);
  return data.data;
}

export async function requestPayout(amountPaise: number) {
  const { data } = await api.post<{ success: boolean; data: any }>("/wallet/request-payout", { amountPaise });
  return data.data;
}
