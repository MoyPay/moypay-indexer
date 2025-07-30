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
  OrganizationList,
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
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    if (existingEmployee) {
      await context.db.update(EmployeeList, { id: employeeId }).set({
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...data,
      });
    } else {
      await context.db.insert(EmployeeList).values({
        id: employeeId,
        organization: organization,
        employee: employee,
        salary: BigInt(0),
        status: true,
        createdAt: event.block.timestamp,
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...data,
      });
      
      await incrementOrganizationCounter(organization, 'totalEmployees', context, event);
      await incrementOrganizationCounter(organization, 'activeEmployees', context, event);
    }
    
    if (data.status !== undefined) {
      const wasActive = existingEmployee ? existingEmployee.status : true;
      const isActive = data.status;
      
      if (!wasActive && isActive) {
        await incrementOrganizationCounter(organization, 'activeEmployees', context, event);
      } else if (wasActive && !isActive) {
        await decrementOrganizationCounter(organization, 'activeEmployees', context, event);
      }
    }
  } catch (error) {
    throw error;
  }
};

const calculateTotalSalary = async (organization: string, context: any) => {
  try {
    const employees = await context.db
      .select()
      .from(EmployeeList)
      .where(context.db.and(
        context.db.eq(EmployeeList.organization, organization),
        context.db.eq(EmployeeList.status, true)
      ));
    
    return employees.reduce((total: bigint, employee: any) => total + (employee.salary || BigInt(0)), BigInt(0));
  } catch (error) {
    return BigInt(0);
  }
};

const updateOrganizationList = async (organization: string, data: any, context: any, event: any) => {
  try {
    const existing = await context.db.find(OrganizationList, { id: organization });
    
    if (existing) {
      await context.db.update(OrganizationList, { id: organization }).set({
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...data,
      });
    } else {
      await context.db.insert(OrganizationList).values({
        id: organization,
        organization: organization,
        owner: "",
        token: "",
        periodTime: BigInt(0),
        totalEmployees: 0,
        activeEmployees: 0,
        totalDeposits: BigInt(0),
        totalWithdrawals: BigInt(0),
        countDeposits: 0,
        countWithdraws: 0,
        totalSalary: BigInt(0),
        currentBalance: BigInt(0),
        shortfall: BigInt(0),
        createdAt: event.block.timestamp,
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...data,
      });
    }
  } catch (error) {
    throw error;
  }
};

const incrementOrganizationCounter = async (organization: string, field: string, context: any, event: any) => {
  try {
    const existing = await context.db.find(OrganizationList, { id: organization });
    if (existing) {
      const currentValue = existing[field] || 0;
      await context.db.update(OrganizationList, { id: organization }).set({
        [field]: currentValue + 1,
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
      });
    }
  } catch (error) {
    throw error;
  }
};

const decrementOrganizationCounter = async (organization: string, field: string, context: any, event: any) => {
  try {
    const existing = await context.db.find(OrganizationList, { id: organization });
    if (existing) {
      const currentValue = existing[field] || 0;
      await context.db.update(OrganizationList, { id: organization }).set({
        [field]: Math.max(0, currentValue - 1),
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
      });
    }
  } catch (error) {
    throw error;
  }
};

const recalculateOrganizationMetrics = async (organization: string, context: any, event: any) => {
  try {
    const existing = await context.db.find(OrganizationList, { id: organization });
    if (!existing) return;

    const totalSalary = await calculateTotalSalary(organization, context);
    
    const currentBalance = (existing.totalDeposits || BigInt(0)) - (existing.totalWithdrawals || BigInt(0));
    
    const shortfall = totalSalary > currentBalance ? totalSalary - currentBalance : BigInt(0);
    
    await updateOrganizationList(organization, {
      totalSalary,
      currentBalance,
      shortfall,
    }, context, event);
  } catch (error) {
    throw error;
  }
};

const updateEmployeeCounts = async (organization: string, context: any, event: any) => {
  try {
    await recalculateOrganizationMetrics(organization, context, event);
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
    
    await updateOrganizationList(event.args.organization, {
      owner: event.args.owner,
      token: event.args.token,
    }, context, event);
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
    
    await updateEmployeeCounts(event.log.address, context, event);
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
    
    await updateEmployeeCounts(event.log.address, context, event);
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
    
    const existing = await context.db.find(OrganizationList, { id: event.log.address });
    if (existing) {
      const newTotalDeposits = (existing.totalDeposits || BigInt(0)) + event.args.amount;
      await updateOrganizationList(event.log.address, {
        totalDeposits: newTotalDeposits,
      }, context, event);
    }
    
    await incrementOrganizationCounter(event.log.address, 'countDeposits', context, event);
    
    await recalculateOrganizationMetrics(event.log.address, context, event);
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
    
    const existing = await context.db.find(OrganizationList, { id: event.log.address });
    if (existing) {
      const newTotalWithdrawals = (existing.totalWithdrawals || BigInt(0)) + event.args.amount;
      await updateOrganizationList(event.log.address, {
        totalWithdrawals: newTotalWithdrawals,
      }, context, event);
    }
    
    await incrementOrganizationCounter(event.log.address, 'countWithdraws', context, event);
    
    await recalculateOrganizationMetrics(event.log.address, context, event);
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
    
    const existing = await context.db.find(OrganizationList, { id: event.log.address });
    if (existing) {
      const newTotalWithdrawals = (existing.totalWithdrawals || BigInt(0)) + event.args.amount;
      await updateOrganizationList(event.log.address, {
        totalWithdrawals: newTotalWithdrawals,
      }, context, event);
    }
    
    await incrementOrganizationCounter(event.log.address, 'countWithdraws', context, event);
    
    await recalculateOrganizationMetrics(event.log.address, context, event);
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
    
    await updateOrganizationList(event.log.address, {
      periodTime: event.args.periodTime,
    }, context, event);
  } catch (error) {
    throw error;
  }
});
