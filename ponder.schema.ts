import { onchainTable } from "ponder";

export const OrganizationCreated = onchainTable("OrganizationCreated", t => ({
  id: t.text().primaryKey(),
  owner: t.text(),
  organization: t.text(),
  name: t.text(),
  token: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EarnSalary = onchainTable("EarnSalary", t => ({
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

export const EmployeeSalaryAdded = onchainTable("EmployeeSalaryAdded", t => ({
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

export const EmployeeSalarySet = onchainTable("EmployeeSalarySet", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  salary: t.bigint(),
  startStream: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeStatusChanged = onchainTable(
  "EmployeeStatusChanged",
  t => ({
    id: t.text().primaryKey(),
    organization: t.text(),
    employee: t.text(),
    status: t.boolean(),
    blockNumber: t.integer(),
    blockTimestamp: t.integer(),
    transactionHash: t.text(),
  })
);

export const Deposit = onchainTable("Deposit", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  owner: t.text(),
  amount: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const Withdraw = onchainTable("Withdraw", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  amount: t.bigint(),
  unrealizedSalary: t.bigint(),
  isOfframp: t.boolean(),
  startStream: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const WithdrawAll = onchainTable("WithdrawAll", t => ({
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

export const WithdrawBalanceOrganization = onchainTable(
  "WithdrawBalanceOrganization",
  t => ({
    id: t.text().primaryKey(),
    organization: t.text(),
    amount: t.bigint(),
    isOfframp: t.boolean(),
    blockNumber: t.integer(),
    blockTimestamp: t.integer(),
    transactionHash: t.text(),
  })
);

export const EnableAutoEarn = onchainTable("EnableAutoEarn", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
  amount: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const DisableAutoEarn = onchainTable("DisableAutoEarn", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const PeriodTimeSet = onchainTable("PeriodTimeSet", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  periodTime: t.bigint(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const SetName = onchainTable("SetName", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  name: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const SetEmployeeName = onchainTable("SetEmployeeName", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  name: t.text(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
  transactionHash: t.text(),
}));

export const EmployeeList = onchainTable("EmployeeList", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  name: t.text(),
  salary: t.bigint(),
  status: t.boolean(),
  createdAt: t.integer(),
  lastUpdated: t.integer(),
  lastTransaction: t.text(),
  lastStatusUpdated: t.integer(),
  lastSalaryUpdated: t.integer(),
  lastCompensationSalary: t.bigint(),
  currentSalaryBalance: t.bigint(),
  salaryBalanceTimestamp: t.integer(),
  salaryStreamStartTime: t.integer(),
  salaryPerSecond: t.bigint(),
  totalEarned: t.bigint(),
  totalWithdrawn: t.bigint(),
  availableBalance: t.bigint(),
  lastBalanceUpdate: t.integer(),
  streamingActive: t.boolean(),
  unrealizedSalary: t.bigint(),
  autoEarnStatus: t.boolean(),
}));

export const EmployeeAutoEarn = onchainTable("EmployeeAutoEarn", t => ({
  id: t.text().primaryKey(),
  organization: t.text(),
  employee: t.text(),
  protocol: t.text(),
  autoEarnAmount: t.bigint(),
  isAutoEarn: t.boolean(),
  totalShares: t.bigint(),
  totalEarned: t.bigint(),
  totalWithdrawn: t.bigint(),
  createdAt: t.integer(),
  lastUpdated: t.integer(),
  lastTransaction: t.text(),
  enabledAt: t.integer(),
  disabledAt: t.integer().notNull().default(0),
  isActive: t.boolean(),
  blockNumber: t.integer(),
  blockTimestamp: t.integer(),
}));

export const OrganizationList = onchainTable("OrganizationList", t => ({
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

export const OrganizationJoinedList = onchainTable(
  "OrganizationJoinedList",
  t => ({
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
  })
);
