"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getUserAccounts() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    } catch (dbErr) {
      // Database level error (connection/tenant) - surface helpful message
      console.error("Database error when finding user:", dbErr);
      throw new Error(
        "Error querying the database. Check DATABASE_URL and database availability. " +
          dbErr.message
      );
    }

    if (!user) {
      throw new Error("User not found");
    }

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error("getUserAccounts error:", error.message ?? error);
    throw error;
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    let user;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    } catch (dbErr) {
      console.error("Database error when finding user in createAccount:", dbErr);
      throw new Error(
        "Error querying the database. Check DATABASE_URL and database availability. " +
          dbErr.message
      );
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If it's the first account, make it default regardless of user input
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault, // Override the isDefault based on our logic
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    console.error("createAccount error:", error.message ?? error);
    throw error;
  }
}

export async function getDashboardData() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let user;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    } catch (dbErr) {
      console.error("Database error when finding user in getDashboardData:", dbErr);
      throw new Error(
        "Error querying the database. Check DATABASE_URL and database availability. " +
          dbErr.message
      );
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Get all user transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return transactions.map(serializeTransaction);
  } catch (error) {
    console.error("getDashboardData error:", error.message ?? error);
    throw error;
  }
}