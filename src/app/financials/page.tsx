"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  RefreshCw,
  Plus,
  Save,
  PiggyBank,
  Receipt,
  Wallet,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  RevenueQuarterlyChart,
  RevenueByServiceChart,
  MarginTrendChart,
  CashFlowChart,
  ConsultantHoursChart,
  TeamStructureChart,
  UtilizationMetrics,
  ContractorRateCard,
  PipelineFunnel,
  WinRateAnalysis,
  ContractorSpendBreakdown,
} from "@/components/financials";

interface FinancialRecord {
  id: string;
  company: string;
  period: string;
  period_start: string | null;
  period_end: string | null;
  revenue: number | null;
  expenses: number | null;
  net_income: number | null;
  arr: number | null;
  mrr: number | null;
  gross_margin: number | null;
  headcount: number | null;
  revenue_per_employee: number | null;
  cash_on_hand: number | null;
  accounts_receivable: number | null;
  accounts_payable: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-secondary/60 rounded-lg p-4 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p
        className={`text-xl font-bold ${
          trend === "up"
            ? "text-green-400"
            : trend === "down"
            ? "text-red-400"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CompanyFinancials({
  company,
  records,
  onUpdate,
}: {
  company: string;
  records: FinancialRecord[];
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FinancialRecord>>({});
  const [saving, setSaving] = useState(false);

  const latestRecord = records[0];

  const handleEdit = (record: FinancialRecord) => {
    setEditing(record.id);
    setEditData(record);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_financials")
        .update({
          revenue: editData.revenue,
          expenses: editData.expenses,
          net_income: editData.net_income,
          arr: editData.arr,
          mrr: editData.mrr,
          gross_margin: editData.gross_margin,
          headcount: editData.headcount,
          cash_on_hand: editData.cash_on_hand,
          accounts_receivable: editData.accounts_receivable,
          accounts_payable: editData.accounts_payable,
          notes: editData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing);

      if (error) throw error;
      setEditing(null);
      onUpdate();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPeriod = async () => {
    try {
      const { error } = await supabase.from("company_financials").insert({
        company,
        period: "New Period",
        notes: "Enter financial data",
      });
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error("Failed to add period:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {latestRecord && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Revenue"
            value={formatCurrency(latestRecord.revenue)}
            icon={DollarSign}
          />
          <MetricCard
            label="Net Income"
            value={formatCurrency(latestRecord.net_income)}
            icon={TrendingUp}
            trend={
              latestRecord.net_income
                ? latestRecord.net_income > 0
                  ? "up"
                  : "down"
                : "neutral"
            }
          />
          <MetricCard
            label="ARR"
            value={formatCurrency(latestRecord.arr)}
            icon={PiggyBank}
          />
          <MetricCard
            label="Headcount"
            value={latestRecord.headcount?.toString() || "—"}
            icon={Users}
          />
        </div>
      )}

      {/* Period Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Financial Periods
          </h3>
          <Button variant="outline" size="sm" onClick={handleAddPeriod}>
            <Plus className="w-4 h-4 mr-2" />
            Add Period
          </Button>
        </div>

        {records.map((record) => (
          <Card
            key={record.id}
            className="bg-card border-border hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{record.period}</CardTitle>
                {editing === record.id ? (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(record)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing === record.id ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Revenue
                    </label>
                    <Input
                      type="number"
                      value={editData.revenue || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          revenue: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Expenses
                    </label>
                    <Input
                      type="number"
                      value={editData.expenses || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          expenses: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Net Income
                    </label>
                    <Input
                      type="number"
                      value={editData.net_income || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          net_income: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">ARR</label>
                    <Input
                      type="number"
                      value={editData.arr || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          arr: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">MRR</label>
                    <Input
                      type="number"
                      value={editData.mrr || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          mrr: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Gross Margin %
                    </label>
                    <Input
                      type="number"
                      value={editData.gross_margin || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          gross_margin: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Headcount
                    </label>
                    <Input
                      type="number"
                      value={editData.headcount || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          headcount: parseInt(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Cash on Hand
                    </label>
                    <Input
                      type="number"
                      value={editData.cash_on_hand || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          cash_on_hand: parseFloat(e.target.value) || null,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <label className="text-xs text-muted-foreground">
                      Notes
                    </label>
                    <Input
                      value={editData.notes || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Revenue:</span>{" "}
                    <span className="font-medium">
                      {formatCurrency(record.revenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expenses:</span>{" "}
                    <span className="font-medium">
                      {formatCurrency(record.expenses)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net Income:</span>{" "}
                    <span
                      className={`font-medium ${
                        record.net_income
                          ? record.net_income > 0
                            ? "text-green-400"
                            : "text-red-400"
                          : ""
                      }`}
                    >
                      {formatCurrency(record.net_income)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ARR:</span>{" "}
                    <span className="font-medium">
                      {formatCurrency(record.arr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">MRR:</span>{" "}
                    <span className="font-medium">
                      {formatCurrency(record.mrr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margin:</span>{" "}
                    <span className="font-medium">
                      {formatPercent(record.gross_margin)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Headcount:</span>{" "}
                    <span className="font-medium">
                      {record.headcount || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cash:</span>{" "}
                    <span className="font-medium">
                      {formatCurrency(record.cash_on_hand)}
                    </span>
                  </div>
                  {record.notes && (
                    <div className="col-span-2 md:col-span-4 text-muted-foreground italic">
                      {record.notes}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {records.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-muted-foreground">No financial data yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAddPeriod}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Period
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function FinancialsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchRecords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_financials")
        .select("*")
        .order("period_start", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load financials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const calibrateRecords = records.filter((r) =>
    r.company.toLowerCase().includes("calibrate")
  );
  const cldRecords = records.filter(
    (r) =>
      r.company.toLowerCase().includes("cld") ||
      r.company.toLowerCase().includes("consulting")
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
            <Wallet className="w-7 h-7 text-primary" />
            Company Financials
          </h1>
          <p className="text-muted-foreground text-sm">
            Track revenue, expenses, and key metrics
          </p>
        </div>
        <Button variant="outline" onClick={fetchRecords}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Company Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="calibrate" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Calibrate HCM
          </TabsTrigger>
          <TabsTrigger value="cld" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            CLD Consulting
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueQuarterlyChart />
              <RevenueByServiceChart />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarginTrendChart />
              <CashFlowChart />
            </div>

            {/* Team & Utilization */}
            <h2 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team & Utilization
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConsultantHoursChart />
              <TeamStructureChart />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UtilizationMetrics />
              <ContractorRateCard />
            </div>

            {/* Pipeline & Spend */}
            <h2 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Pipeline & Contractor Spend
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PipelineFunnel />
              <WinRateAnalysis />
            </div>
            <ContractorSpendBreakdown />
          </div>
        </TabsContent>

        <TabsContent value="calibrate">
          <CompanyFinancials
            company="Calibrate HCM"
            records={calibrateRecords}
            onUpdate={fetchRecords}
          />
        </TabsContent>

        <TabsContent value="cld">
          <CompanyFinancials
            company="CLD Consulting"
            records={cldRecords}
            onUpdate={fetchRecords}
          />
        </TabsContent>

        <TabsContent value="upload">
          <ReportUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("Calibrate HCM");
  const [selectedReportType, setSelectedReportType] = useState("pl");
  const [dragActive, setDragActive] = useState(false);

  const reportTypes = [
    { value: "pl", label: "Profit & Loss" },
    { value: "balance_sheet", label: "Balance Sheet" },
    { value: "cash_flow", label: "Cash Flow Statement" },
    { value: "ar_aging", label: "AR Aging" },
    { value: "ap_aging", label: "AP Aging" },
    { value: "general_ledger", label: "General Ledger" },
    { value: "other", label: "Other" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("company", selectedCompany);
      formData.append("reportType", selectedReportType);

      const response = await fetch("/api/financials/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles((prev) => [...prev, result.message]);
      } else {
        console.error("Upload failed:", result.error);
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Financial Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload QuickBooks exports, P&L statements, or other financial reports.
            Supported formats: CSV, PDF, Excel (.xlsx)
          </p>

          {/* Company & Report Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
              >
                <option value="Calibrate HCM">Calibrate HCM</option>
                <option value="CLD Consulting">CLD Consulting</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm"
              >
                {reportTypes.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm mb-2">
                  Drag & drop your report here, or{" "}
                  <label className="text-primary cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.pdf,.xlsx,.xls"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, PDF, or Excel files up to 10MB
                </p>
              </>
            )}
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded this session:</h4>
              {uploadedFiles.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {msg}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">How to export from QuickBooks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. In QuickBooks, go to <strong>Reports</strong></p>
          <p>2. Select the report you want (e.g., Profit & Loss)</p>
          <p>3. Set the date range</p>
          <p>4. Click <strong>Export</strong> → <strong>Export to Excel</strong> or <strong>Export to PDF</strong></p>
          <p>5. Upload the file here</p>
        </CardContent>
      </Card>
    </div>
  );
}
