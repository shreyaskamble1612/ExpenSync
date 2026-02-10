import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetProgress } from "./_components/budget-progress";
import { DashboardOverview } from "./_components/transaction-overview";
import { getCurrentBudget } from "@/actions/budget";
import { Plus } from "lucide-react";
import { AccountCard } from "./_components/account-card";

export default async function DashboardPage() {
  let accounts = [];
  let transactions = [];

  try {
    [accounts, transactions] = await Promise.all([
      getUserAccounts(),
      getDashboardData(),
    ]);
  } catch (error) {
    // Log and render a friendly message instead of crashing the page
    console.error("Dashboard data load error:", error?.message ?? error);

    return (
      <div className="space-y-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-700">Unable to load dashboard</h2>
          <p className="text-sm text-red-600 mt-2">There was a problem loading your dashboard data. Please try again shortly or contact support.</p>
        </div>
      </div>
    );
  }

  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className="space-y-8">
      {/* Budget Progress */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Dashboard Overview */}
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}