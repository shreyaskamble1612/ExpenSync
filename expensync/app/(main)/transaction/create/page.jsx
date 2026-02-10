import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  let accounts = [];
  try {
    accounts = await getUserAccounts();
  } catch (error) {
    console.error("Unable to load accounts for AddTransactionPage:", error?.message ?? error);

    return (
      <div className="max-w-3xl mx-auto px-5">
        <div className="flex justify-center md:justify-normal mb-8">
          <h1 className="text-5xl gradient-title">Add Transaction</h1>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-700">Unable to load accounts</h2>
          <p className="text-sm text-red-600 mt-2">We couldn't load your accounts right now. Please check your connection or try again later.</p>
        </div>
      </div>
    );
  }

  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit ?? null;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title">Add Transaction</h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
}
