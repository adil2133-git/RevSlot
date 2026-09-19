"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  fetchWalletOverview,
  savePayoutProfile,
  requestPayout,
  type WalletOverview,
} from "@/features/wallet/walletApi";

export default function WalletPage() {
  const [data, setData] = useState<WalletOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payout Profile Form State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"bank_account" | "upi">("bank_account");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showEscrowInfo, setShowEscrowInfo] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await fetchWalletOverview();
      setData(overview);
      if (overview.payoutProfile) {
        setPayoutMethod(overview.payoutProfile.payoutMethod);
        setAccountHolderName(overview.payoutProfile.accountHolderName || "");
        setAccountNumber(overview.payoutProfile.accountNumber || "");
        setIfscCode(overview.payoutProfile.ifscCode || "");
        setUpiId(overview.payoutProfile.upiId || "");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await savePayoutProfile({
        payoutMethod,
        accountHolderName: payoutMethod === "bank_account" ? accountHolderName : undefined,
        accountNumber: payoutMethod === "bank_account" ? accountNumber : undefined,
        ifscCode: payoutMethod === "bank_account" ? ifscCode : undefined,
        upiId: payoutMethod === "upi" ? upiId : undefined,
      });
      setProfileMsg("Payout details saved successfully!");
      await loadData();
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err: any) {
      setProfileMsg(err?.response?.data?.message || "Failed to save payout profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      setWithdrawMsg({ type: "error", text: "Minimum withdrawal amount is ₹100" });
      return;
    }

    if (!data?.payoutProfile) {
      setWithdrawMsg({ type: "error", text: "Please configure your payout details first" });
      return;
    }

    const availableRupees = (data?.wallet.availableBalance || 0) / 100;
    if (amountNum > availableRupees) {
      setWithdrawMsg({ type: "error", text: `Requested amount exceeds available balance (₹${availableRupees.toFixed(2)})` });
      return;
    }

    setWithdrawMsg(null);
    setShowConfirmModal(true);
  };

  const handleConfirmWithdraw = async () => {
    const amountNum = parseFloat(withdrawAmount);
    setWithdrawing(true);
    try {
      await requestPayout(Math.round(amountNum * 100));
      setShowConfirmModal(false);
      setWithdrawMsg({
        type: "success",
        text: `Payout request of ₹${amountNum.toFixed(2)} submitted! Admin will process transfer within 24–48 hours.`,
      });
      setWithdrawAmount("");
      await loadData();
    } catch (err: any) {
      setShowConfirmModal(false);
      setWithdrawMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to submit payout request",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-slate-200"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-28 rounded-2xl bg-slate-100"></div>
            <div className="h-28 rounded-2xl bg-slate-100"></div>
            <div className="h-28 rounded-2xl bg-slate-100"></div>
            <div className="h-28 rounded-2xl bg-slate-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h3 className="font-semibold">Unable to load wallet</h3>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { wallet, payoutProfile, transactions } = data;
  const availableRupees = wallet.availableBalance / 100;
  const pendingRupees = wallet.pendingBalance / 100;
  const withdrawnRupees = wallet.withdrawnBalance / 100;
  const totalRupees = wallet.totalEarnings / 100;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Earnings & Wallet</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track review session earnings, pending clearance, and request payouts to your bank account or UPI.
          </p>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          ⚙️ {payoutProfile ? "Edit Payout Details" : "Add Payout Details"}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Balance */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Available to Withdraw</p>
          <p className="mt-2 text-3xl font-bold text-emerald-950">₹{availableRupees.toFixed(2)}</p>
          <p className="mt-1 text-xs text-emerald-600">Cleared funds ready for payout request</p>
        </div>

        {/* Pending Clearance */}
        <div className="relative rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Clearance (48h)</p>
            <button
              type="button"
              onClick={() => setShowEscrowInfo(!showEscrowInfo)}
              className="text-xs text-amber-600 hover:text-amber-800 font-bold"
              title="Click to learn how clearance works"
            >
              ℹ️
            </button>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-950">₹{pendingRupees.toFixed(2)}</p>
          <p className="mt-1 text-xs text-amber-600">Clears 48h after completed session</p>

          {showEscrowInfo && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-white p-3 text-xs text-amber-900 shadow-sm">
              <p className="font-semibold">Why are earnings pending clearance?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Session fees are held safely for 48 hours following a completed session. This window allows for technical issue resolution before moving to your Available Balance.
              </p>
              <button
                onClick={() => setShowEscrowInfo(false)}
                className="mt-2 text-[10px] font-semibold text-amber-700 underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Withdrawn */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Withdrawn</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">₹{withdrawnRupees.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Transferred to your bank/UPI</p>
        </div>

        {/* Lifetime Earnings */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Lifetime Earnings</p>
          <p className="mt-2 text-3xl font-bold text-blue-950">₹{totalRupees.toFixed(2)}</p>
          <p className="mt-1 text-xs text-blue-600">Total earned from all completed sessions</p>
        </div>
      </div>

      {/* Main Content: Withdraw Form + Payout Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdraw Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">Request Payout</h2>
          <p className="mt-1 text-xs text-slate-500">
            Request withdrawal of your cleared funds directly to your verified payout method.
          </p>

          {!payoutProfile ? (
            <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold text-amber-900">⚠️ Payout Details Required</p>
              <p className="mt-1 text-xs text-amber-700">
                Please configure your Bank Account or UPI ID before submitting a payout request.
              </p>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
              >
                + Add Bank / UPI Details
              </button>
            </div>
          ) : (
            <form onSubmit={handlePreWithdraw} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    max={availableRupees}
                    step="1"
                    placeholder="e.g. 500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>Available: ₹{availableRupees.toFixed(2)} · Minimum: ₹100</span>
                  {availableRupees >= 100 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.floor(availableRupees).toString())}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Withdraw All
                    </button>
                  )}
                </div>
              </div>

              {withdrawMsg && (
                <p
                  className={`text-xs font-medium p-3 rounded-lg ${
                    withdrawMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {withdrawMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={withdrawing || availableRupees < 100}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
              >
                Request Payout
              </button>
            </form>
          )}
        </div>

        {/* Payout Destination Info */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payout Destination</h3>
            {payoutProfile ? (
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-semibold text-slate-900 uppercase">
                    {payoutProfile.payoutMethod === "bank_account" ? "Bank Transfer" : "UPI ID"}
                  </span>
                </div>
                {payoutProfile.payoutMethod === "bank_account" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Holder:</span>
                      <span className="font-medium text-slate-800">{payoutProfile.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account:</span>
                      <span className="font-medium text-slate-800">
                        ••••{payoutProfile.accountNumber?.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IFSC:</span>
                      <span className="font-medium text-slate-800">{payoutProfile.ifscCode}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UPI ID:</span>
                    <span className="font-medium text-slate-800">{payoutProfile.upiId}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-800">
                ⚠️ No payout details configured yet. Add your bank account or UPI ID to receive payouts.
              </div>
            )}
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="mt-6 w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            {payoutProfile ? "Update Details" : "Set Up Details"}
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Wallet Transactions</h2>
          <span className="text-xs text-slate-400">Last 30 events</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No transactions yet. Confirmed review bookings will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  let label = tx.type.replace(/_/g, " ");
                  if (tx.type === "credit_escrow") label = "Pending Clearance";
                  if (tx.type === "escrow_cleared") label = "Earnings Cleared";
                  if (tx.type === "withdrawal") label = "Payout Request";
                  if (tx.type === "cancellation_compensation") label = "Cancellation Fee";

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {dayjs(tx.createdAt).format("MMM D, YYYY · h:mm A")}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                            tx.type === "credit_escrow"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : tx.type === "escrow_cleared"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tx.type === "withdrawal"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700">{tx.description || "-"}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            tx.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : tx.status === "disputed"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tx.status === "completed" && "✅ Cleared"}
                          {tx.status === "pending" && "⏳ Processing"}
                          {tx.status === "disputed" && "⚠️ Disputed Hold"}
                          {tx.status === "failed" && "❌ Failed"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-semibold text-slate-900">
                        {tx.type === "withdrawal" || tx.type === "escrow_cancelled" ? "-" : "+"}₹
                        {(tx.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Confirm Withdrawal Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please review the payout details before confirming.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-sm font-bold text-slate-900">₹{parseFloat(withdrawAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {payoutProfile?.payoutMethod === "bank_account" ? "Bank Transfer" : "UPI ID"}
                </span>
              </div>
              {payoutProfile?.payoutMethod === "bank_account" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account:</span>
                    <span className="font-medium text-slate-800">
                      ••••{payoutProfile.accountNumber?.slice(-4)} ({payoutProfile.accountHolderName})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC:</span>
                    <span className="font-medium text-slate-800">{payoutProfile.ifscCode}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-medium text-slate-800">{payoutProfile?.upiId}</span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 flex items-start gap-2">
              <span>ℹ️</span>
              <p className="leading-relaxed">
                Payout requests are reviewed by our team and transferred to your account within 24–48 business hours.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={withdrawing}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
              >
                {withdrawing ? "Submitting..." : "Confirm & Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payout Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Payout Details</h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide your bank details or UPI ID where payouts will be transferred.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bank_account")}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      payoutMethod === "bank_account"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("upi")}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      payoutMethod === "upi"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    UPI ID
                  </button>
                </div>
              </div>

              {payoutMethod === "bank_account" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm uppercase outline-none focus:border-emerald-600"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {profileMsg && (
                <p className="text-xs font-medium text-emerald-700">{profileMsg}</p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
