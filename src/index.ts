import { ponder } from "ponder:registry";
import { createHash, randomBytes } from "crypto";
import {
  OrganizationCreated,
  EarnSalary,
  EmployeeSalarySet,
  EmployeeStatusChanged,
  Deposit,
  Withdraw,
  WithdrawAll,
  PeriodTimeSet,
  EmployeeList,
} from "ponder:schema";

const handleEvent = async (table: any, event: any, context: any, extraValues = {}) => {
  const randomValue = randomBytes(16).toString("hex");
  const id = createHash("sha256")
    .update(`${event.transaction.hash}-${event.block.number}-${event.block.timestamp}-${randomValue}`.trim())
    .digest("hex");
  await context.db.insert(table).values({
    id: id,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    ...extraValues,
  });
};

const updateEmployeeList = async (organization: string, employee: string, data: any, context: any, event: any) => {
  const employeeId = `${organization}-${employee}`;

  try {

    await context.db.insert(EmployeeList).values({
      id: employeeId,
      organization: organization,
      employee: employee,
      salary: BigInt(0),
      status: false,
      createdAt: event.block.timestamp,
      lastUpdated: event.block.timestamp,
      lastTransaction: event.transaction.hash,
      ...data,
    });
  } catch (error) {
    throw error;
  }
};

ponder.on("Factory:OrganizationCreated", async ({ event, context }) => {
  try {
    await handleEvent(OrganizationCreated, event, context, {
      owner: event.args.owner,
      organization: event.args.organization,
      token: event.args.token,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:EarnSalary", async ({ event, context }) => {
  try {
    await handleEvent(EarnSalary, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      protocol: event.args.protocol,
      amount: event.args.amount,
      shares: event.args.shares,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:EmployeeSalarySet", async ({ event, context }) => {
  try {
    await handleEvent(EmployeeSalarySet, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      salary: event.args.salary,
      timestamp: event.args.timestamp,
    });
    await updateEmployeeList(event.log.address, event.args.employee, { salary: event.args.salary }, context, event);
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:EmployeeStatusChanged", async ({ event, context }) => {
  try {
    await handleEvent(EmployeeStatusChanged, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      status: event.args.status,
    });
    await updateEmployeeList(event.log.address, event.args.employee, { status: event.args.status }, context, event);
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:Deposit", async ({ event, context }) => {
  try {
    await handleEvent(Deposit, event, context, {
      organization: event.log.address,
      owner: event.args.owner,
      amount: event.args.amount,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:Withdraw", async ({ event, context }) => {
  try {
    await handleEvent(Withdraw, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      amount: event.args.amount,
      isOfframp: event.args.isOfframp,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:WithdrawAll", async ({ event, context }) => {
  try {
    await handleEvent(WithdrawAll, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      amount: event.args.amount,
      isOfframp: event.args.isOfframp,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:PeriodTimeSet", async ({ event, context }) => {
  try {
    await handleEvent(PeriodTimeSet, event, context, {
      organization: event.log.address,
      periodTime: event.args.periodTime,
    });
  } catch (error) {
    throw error;
  }
});
