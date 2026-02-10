import { db } from '../lib/prisma.js';
import { subDays } from 'date-fns';

const ACCOUNT_ID = '09de1c94-0362-4a6c-95e7-85c327281bf4';
const USER_ID = '5821581b-008e-4a30-815d-683b870c651c';

const CATEGORIES = {
  INCOME: [
    { name: 'salary', range: [5000, 8000] },
    { name: 'freelance', range: [1000, 3000] },
    { name: 'investments', range: [500, 2000] },
    { name: 'other-income', range: [100, 1000] },
  ],
  EXPENSE: [
    { name: 'housing', range: [1000, 2000] },
    { name: 'transportation', range: [100, 500] },
    { name: 'groceries', range: [200, 600] },
    { name: 'utilities', range: [100, 300] },
    { name: 'entertainment', range: [50, 200] },
    { name: 'food', range: [50, 150] },
    { name: 'shopping', range: [100, 500] },
    { name: 'healthcare', range: [100, 1000] },
    { name: 'education', range: [200, 1000] },
    { name: 'travel', range: [500, 2000] },
  ],
};

function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

async function seedTransactions() {
  try {
    // Ensure the seed user exists
    await db.user.upsert({
      where: { id: USER_ID },
      update: {},
      create: {
        id: USER_ID,
        clerkUserId: 'seed-clerk-user',
        email: 'seed@example.com',
        name: 'Seed User',
      },
    });

    // Ensure the seed account exists and belongs to the seed user
    await db.account.upsert({
      where: { id: ACCOUNT_ID },
      update: { userId: USER_ID },
      create: {
        id: ACCOUNT_ID,
        name: 'Seed Account',
        type: 'CURRENT',
        balance: 0,
        isDefault: true,
        userId: USER_ID,
      },
    });

    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const type = Math.random() < 0.4 ? 'INCOME' : 'EXPENSE';
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${type === 'INCOME' ? 'Received' : 'Paid for'} ${category}`,
          date,
          category,
          status: 'COMPLETED',
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === 'INCOME' ? amount : -amount;
        transactions.push(transaction);
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } });

      // Prisma createMany can fail if there are duplicates; we assume fresh ids
      await tx.transaction.createMany({ data: transactions });

      await tx.account.update({ where: { id: ACCOUNT_ID }, data: { balance: totalBalance } });
    });

    console.log(`Created ${transactions.length} transactions`);
    return { success: true, count: transactions.length };
  } catch (error) {
    console.error('Error seeding transactions:', error);
    return { success: false, error: error.message ?? String(error) };
  }
}

(async () => {
  try {
    const result = await seedTransactions();
    if (!result.success) {
      console.error('Seeding failed:', result.error);
      process.exit(1);
    }
    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error while seeding:', err);
    process.exit(1);
  }
})();
