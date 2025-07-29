import { onchainTable } from "ponder";

export const OrganizationCreated = onchainTable("OrganizationCreated", (t) => ({
  id: t.text().primaryKey(),
  owner: t.text(),
  organization: t.text(),
  token: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EarnSalary = onchainTable("EarnSalary", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
  amount: t.bigint(),
  shares: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeSalarySet = onchainTable("EmployeeSalarySet", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  salary: t.bigint(),
  timestamp: t.integer(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeStatusChanged = onchainTable("EmployeeStatusChanged", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  status: t.boolean(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const Deposit = onchainTable("Deposit", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  owner: t.text(),
  amount: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const Withdraw = onchainTable("Withdraw", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  amount: t.bigint(),
  isOfframp: t.boolean(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const WithdrawAll = onchainTable("WithdrawAll", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  amount: t.bigint(),
  isOfframp: t.boolean(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const PeriodTimeSet = onchainTable("PeriodTimeSet", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  periodTime: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));
