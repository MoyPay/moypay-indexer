import { onchainTable } from "ponder";

export const OrganizationCreated = onchainTable("OrganizationCreated", (t) => ({
  id: t.text().primaryKey(),
  owner: t.text(),
  organization: t.text(),
  name: t.text(),
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

export const EmployeeSalaryAdded = onchainTable("EmployeeSalaryAdded", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  name: t.text(),
  employee: t.text(),
  salary: t.bigint(),
  startStream: t.bigint(),
  timestamp: t.bigint(),
  isAutoEarn: t.boolean(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeSalarySet = onchainTable("EmployeeSalarySet", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  salary: t.bigint(),
  startStream: t.bigint(),
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
  startStream: t.bigint(),
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
  startStream: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EnableAutoEarn = onchainTable("EnableAutoEarn", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
  amount: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const DisableAutoEarn = onchainTable("DisableAutoEarn", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
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

export const SetName = onchainTable("SetName", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  name: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeList = onchainTable("EmployeeList", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  name: t.text(),
  salary: t.bigint(), // Base salary amount per period
  status: t.boolean(),
  createdAt: t.integer(),
  lastUpdated: t.integer(),
  lastTransaction: t.text(),
  lastStatusUpdated: t.integer(),
  lastSalaryUpdated: t.integer(),
  lastCompensationSalary: t.bigint(),
  // New salary balance and timestamp tracking entities
  currentSalaryBalance: t.bigint(), // Real-time accumulated salary balance
  salaryBalanceTimestamp: t.integer(), // Timestamp when balance was last calculated
  salaryStreamStartTime: t.integer(), // When salary streaming started
  salaryPerSecond: t.bigint(), // Calculated salary per second for streaming
  totalEarned: t.bigint(), // Total salary earned to date
  totalWithdrawn: t.bigint(), // Total salary withdrawn to date
  availableBalance: t.bigint(), // currentSalaryBalance - totalWithdrawn
  lastBalanceUpdate: t.integer(), // Last time balance was recalculated
  streamingActive: t.boolean(), // Whether salary streaming is currently active
}));

export const OrganizationList = onchainTable("OrganizationList", (t) => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  name: t.text(),
  owner: t.text(),
  token: t.text(),
  periodTime: t.bigint(),
  totalEmployees: t.integer(),
  activeEmployees: t.integer(),
  totalDeposits: t.bigint(),
  totalWithdrawals: t.bigint(),
  countDeposits: t.integer(),
  countWithdraws: t.integer(),
  totalSalary: t.bigint(),
  currentBalance: t.bigint(),
  shortfall: t.bigint(),
  createdAt: t.integer(),
  lastUpdated: t.integer(),
  lastTransaction: t.text(),
}));

export const OrganizationJoinedList = onchainTable("OrganizationJoinedList", (t) => ({
  id: t.text().primaryKey(),
  employee: t.text(),
  organization: t.text(),
  name: t.text(),
  owner: t.text(),
  token: t.text(),
  periodTime: t.bigint(),
  totalEmployees: t.integer(),
  activeEmployees: t.integer(),
  totalDeposits: t.bigint(),
  totalWithdrawals: t.bigint(),
  countDeposits: t.integer(),
  countWithdraws: t.integer(),
  totalSalary: t.bigint(),
  currentBalance: t.bigint(),
  shortfall: t.bigint(),
  createdAt: t.integer(),
  lastUpdated: t.integer(),
  lastTransaction: t.text(),
}));
