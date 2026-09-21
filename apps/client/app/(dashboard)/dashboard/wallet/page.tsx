"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  QrCode,
  Download,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  FileText,
  Coins,
  Star,
  Check,
  X,
} from "lucide-react";
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

  // Payout Profile Form Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"bank_account" | "upi">("bank_account");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Requisition / Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showClearanceModal, setShowClearanceModal] = useState(false);

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
      setProfileMsg({ type: "success", text: "Payout destination saved and verified successfully!" });
      await loadData();
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileMsg(null);
      }, 1200);
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to save payout profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      setWithdrawMsg({ type: "error", text: "Minimum withdrawal requisition is ₹100.00" });
      return;
    }

    if (!data?.payoutProfile) {
      setWithdrawMsg({ type: "error", text: "Please configure your payout destination before submitting a requisition." });
      return;
    }

    const availableRupees = (data?.wallet.availableBalance || 0) / 100;
    if (amountNum > availableRupees) {
      setWithdrawMsg({
        type: "error",
        text: `Requisition amount exceeds eligible available balance (₹${availableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })})`,
      });
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
        text: `Transfer requisition of ₹${amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} initiated! Disbursed under T+1 settlement.`,
      });
      setWithdrawAmount("");
      await loadData();
    } catch (err: any) {
      setShowConfirmModal(false);
      setWithdrawMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to submit transfer requisition",
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!data || data.transactions.length === 0) return;
    const headers = ["Transaction ID", "Date", "Type", "Description", "Status", "Amount (INR)"];
    const rows = data.transactions.map((tx) => [
      tx.id,
      dayjs(tx.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      tx.type,
      `"${tx.description || ""}"`,
      tx.status,
      (tx.amount / 100).toFixed(2),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RevSlot_Wallet_Statement_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-14 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white border border-slate-200/80" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white border border-slate-200/80" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h3 className="font-bold text-sm">Unable to load wallet data</h3>
        <p className="mt-1 text-xs">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { wallet, payoutProfile, transactions } = data;
  const availableRupees = wallet.availableBalance / 100;
  const pendingRupees = wallet.pendingBalance / 100;
  const withdrawnRupees = wallet.withdrawnBalance / 100;
  const totalRupees = wallet.totalEarnings / 100;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Earnings &amp; Wallet
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Manage reviewer honorarium disbursements, track clearance periods, and withdraw funds.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Download CSV Statement"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Available to Withdraw */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Available to Withdraw
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ₹{availableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Ready for immediate transfer to linked account</span>
          </div>
        </div>

        {/* Card 2: Pending Clearance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Pending Clearance
              </span>
              <button
                onClick={() => setShowClearanceModal(true)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Clearance details"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ₹{pendingRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-amber-500 font-bold shrink-0">⁕</span>
            <span className="truncate">From recent evaluations completed within hold</span>
          </div>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Total Withdrawn
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ₹{withdrawnRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Disbursed across successful payout cycles</span>
          </div>
        </div>

        {/* Card 4: Lifetime Earnings */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Lifetime Earnings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ₹{totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Total compensation across completed defenses</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Simple & Clean Request Payout & Payout Method */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Payout */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900">Request Payout</h2>
              <span className="text-xs font-semibold text-slate-500">
                Available: <strong className="text-slate-900">₹{availableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Withdraw your cleared review earnings directly to your bank account or UPI ID.
            </p>

            {/* Form */}
            <form onSubmit={handlePreWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Amount to Withdraw
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <span className="text-sm font-bold text-slate-400 mr-2 select-none">₹</span>
                  <input
                    type="number"
                    min="100"
                    max={availableRupees}
                    step="1"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full text-sm font-bold text-slate-900 placeholder-slate-300 outline-none bg-transparent"
                  />
                  {availableRupees >= 100 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.floor(availableRupees).toString())}
                      className="shrink-0 text-xs font-bold text-primary hover:text-primary/80 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      MAX
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Minimum withdrawal amount is ₹100.00
                </p>
              </div>

              {withdrawMsg && (
                <div
                  className={`text-xs font-semibold p-3 rounded-xl ${
                    withdrawMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {withdrawMsg.text}
                </div>
              )}

              {/* Destination Summary & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 mt-4">
                <div className="text-xs text-slate-500">
                  {payoutProfile ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      Paying to: <strong className="text-slate-800">{payoutProfile.payoutMethod === "bank_account" ? `Bank ••••${payoutProfile.accountNumber?.slice(-4)}` : payoutProfile.upiId}</strong>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">No payout method linked</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={withdrawing || availableRupees < 100 || !payoutProfile}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/95 disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{withdrawing ? "Processing..." : "Withdraw Funds"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Payout Destination */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Payout Method</h3>
              {payoutProfile && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Where your disbursements will be sent.
            </p>

            {/* Destination Card Content */}
            {!payoutProfile ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center my-2">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  No payout method configured
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Add a Bank Account or UPI ID to receive withdrawals.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 my-2 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400 text-[11px]">Type</span>
                  <span className="font-bold text-slate-800">
                    {payoutProfile.payoutMethod === "bank_account" ? "Bank Account" : "UPI ID / VPA"}
                  </span>
                </div>
                {payoutProfile.payoutMethod === "bank_account" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="font-medium text-slate-800">{payoutProfile.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account</span>
                      <span className="font-mono font-medium text-slate-800">
                        •••• {payoutProfile.accountNumber?.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFSC</span>
                      <span className="font-mono font-medium text-slate-800">{payoutProfile.ifscCode}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">UPI ID</span>
                    <span className="font-mono font-medium text-slate-800">{payoutProfile.upiId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="w-full mt-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{payoutProfile ? "Change Payout Method" : "Add Bank or UPI"}</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Section: Wallet Transactions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Header Row */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">Wallet Transactions</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {transactions.length} Records
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Showing last 30 events</span>
            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Filter transactions"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Download CSV"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            No wallet transactions recorded yet. Confirmed review bookings will credit automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Description &amp; Candidate</th>
                  <th className="px-6 py-3">Date &amp; Timestamp</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isCredit = tx.type !== "withdrawal" && tx.type !== "escrow_cancelled";
                  const amountFormatted = (tx.amount / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  });

                  // Pick appropriate icon based on transaction description
                  let Icon = FileText;
                  if (tx.description?.toLowerCase().includes("thesis") || tx.description?.toLowerCase().includes("capstone")) {
                    Icon = GraduationCap;
                  } else if (tx.description?.toLowerCase().includes("payout") || tx.type === "withdrawal") {
                    Icon = ArrowRight;
                  } else if (tx.description?.toLowerCase().includes("viva") || tx.description?.toLowerCase().includes("bonus")) {
                    Icon = Star;
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Description & Candidate */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{tx.description || "Session Honorarium"}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Ref: #{tx.id} • Institutional Audit Verified
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Timestamp */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {dayjs(tx.createdAt).format("MMM D, YYYY")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {dayjs(tx.createdAt).format("hh:mm A")} IST
                        </p>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isCredit
                              ? "bg-blue-50 text-primary border border-blue-200/60"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {isCredit ? "Credit" : "Debit / Payout"}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            tx.status === "completed"
                              ? "bg-blue-50 text-primary border border-blue-200/60"
                              : tx.status === "pending"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : tx.status === "disputed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tx.status === "completed" && <Check className="h-3 w-3 text-primary" />}
                          {tx.status === "pending" && <Clock className="h-3 w-3 text-amber-600" />}
                          {tx.status === "disputed" && <AlertCircle className="h-3 w-3 text-rose-600" />}
                          <span>
                            {tx.status === "completed"
                              ? "Cleared"
                              : tx.status === "pending"
                              ? "Pending Clearance"
                              : tx.status === "disputed"
                              ? "Disputed (On Hold)"
                              : tx.status}
                          </span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-3.5 whitespace-nowrap text-right font-extrabold text-slate-900">
                        <span className={isCredit ? "text-slate-900" : "text-slate-600"}>
                          {isCredit ? "+" : "-"}₹{amountFormatted}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Displaying recent transactions • All disbursements adhere to institutional audit cycles</span>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Download CSV Statement</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Clearance Info Modal */}
      {showClearanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">About Clearance Periods</h3>
              <button
                onClick={() => setShowClearanceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Review session honorariums enter a standard 48-hour to 7-day institutional clearance hold upon session completion. Once the candidate feedback rubric is processed, funds move automatically to your <strong>Available to Withdraw</strong> balance.
            </p>
            <button
              onClick={() => setShowClearanceModal(false)}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary/95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Confirm Withdrawal</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please verify your withdrawal details below.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-sm font-bold text-slate-900">
                  ₹{parseFloat(withdrawAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer To:</span>
                <span className="font-bold text-slate-900">
                  {payoutProfile?.payoutMethod === "bank_account" ? "Bank Account" : "UPI ID"}
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
                    <span className="font-mono font-medium text-slate-800">{payoutProfile.ifscCode}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-mono font-medium text-slate-800">{payoutProfile?.upiId}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={withdrawing}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/95 disabled:opacity-50 transition shadow-xs"
              >
                {withdrawing ? "Processing..." : "Confirm & Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Payout Method</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bank_account")}
                    className={`rounded-xl border py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      payoutMethod === "bank_account"
                        ? "border-primary bg-blue-50 text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Bank Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("upi")}
                    className={`rounded-xl border py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      payoutMethod === "upi"
                        ? "border-primary bg-blue-50 text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>UPI ID</span>
                  </button>
                </div>
              </div>

              {payoutMethod === "bank_account" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Emily Chen"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5010023491823"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. username@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono"
                  />
                </div>
              )}

              {profileMsg && (
                <p
                  className={`text-xs font-semibold p-2.5 rounded-lg ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {profileMsg.text}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/95 disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Payout Method"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
