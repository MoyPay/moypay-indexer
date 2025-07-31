import { ponder } from "ponder:registry";
import { createHash, randomBytes } from "crypto";
import {
  OrganizationCreated,
  EarnSalary,
  EmployeeSalaryAdded,
  EmployeeSalarySet,
  EmployeeStatusChanged,
  Deposit,
  Withdraw,
  WithdrawAll,
  EnableAutoEarn,
  DisableAutoEarn,
  PeriodTimeSet,
  SetName,
  EmployeeList,
  OrganizationList,
  OrganizationJoinedList,
} from "ponder:schema";

const PERIOD_TIMES = {
  DAILY: 86400,
  WEEKLY: 604800,
  MONTHLY: 2592000,
  YEARLY: 31536000,
} as const;

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

const calculateUnclaimedSalary = async (organization: string, employee: string, context: any, event: any) => {
  try {
    const employeeId = `${organization}-${employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    if (!existingEmployee || !existingEmployee.status) {
      return BigInt(0);
    }

    const orgData = await context.db.find(OrganizationList, { id: organization });
    if (!orgData) {
      return BigInt(0);
    }

    const periodTimeSeconds = orgData.periodTime ? Number(orgData.periodTime) : PERIOD_TIMES.MONTHLY;
    
    const lastUpdateTime = existingEmployee.lastSalaryUpdated || existingEmployee.createdAt;
    const currentTime = event.block.timestamp;
    const timeElapsed = currentTime - lastUpdateTime;
    
    const salaryPerSecond = existingEmployee.salary / BigInt(periodTimeSeconds);
    const unclaimedAmount = salaryPerSecond * BigInt(timeElapsed);
    
    return unclaimedAmount;
  } catch (error) {
    return BigInt(0);
  }
};

const updateEmployeeList = async (organization: string, employee: string, data: any, context: any, event: any) => {
  const lastUpdateFields: any = {};
  const employeeId = `${organization}-${employee}`;

  try {
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });

    if (existingEmployee) {
      const wasActive = existingEmployee.status;

      if (data.status !== undefined) {
        lastUpdateFields.lastStatusUpdated = event.block.timestamp;
        
        if (wasActive && !data.status) {
          const unclaimedSalary = await calculateUnclaimedSalary(organization, employee, context, event);
          lastUpdateFields.lastCompensationSalary = unclaimedSalary;
        }
        else if (!wasActive && data.status) {
          lastUpdateFields.lastCompensationSalary = BigInt(0);
        }
      }
      if (data.salary !== undefined) {
        lastUpdateFields.lastSalaryUpdated = event.block.timestamp;
      }

      await context.db.update(EmployeeList, { id: employeeId }).set({
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...lastUpdateFields,
        ...data,
      });

      if (data.status !== undefined) {
        const isActive = data.status;

        if (!wasActive && isActive) {
          await incrementOrganizationCounter(organization, 'activeEmployees', context, event);
        } else if (wasActive && !isActive) {
          await decrementOrganizationCounter(organization, 'activeEmployees', context, event);
        }
      }
    } else {
      const newEmployeeData = {
        id: employeeId,
        organization: organization,
        employee: employee,
        name: "",
        salary: BigInt(0),
        status: true,
        createdAt: event.block.timestamp,
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
        ...data,
      };

      await context.db.insert(EmployeeList).values(newEmployeeData);

      await incrementOrganizationCounter(organization, 'totalEmployees', context, event);

      const finalStatus = data.status !== undefined ? data.status : true;
      if (finalStatus) {
        await incrementOrganizationCounter(organization, 'activeEmployees', context, event);
      }
    }
  } catch (error) {
    throw error;
  }
};

const calculateTotalSalary = async (organization: string, context: any) => {
  try {
    let totalSalary = BigInt(0);

    try {
      const commonEmployeeId = `${organization}-0x746182D0Cccc5CeFc69853bb0325C850029388C0`;
      const employee = await context.db.find(EmployeeList, { id: commonEmployeeId });

      if (employee && employee.status) {
        totalSalary = employee.salary || BigInt(0);
      }
    } catch (findError) {
      throw findError;
    }

    return totalSalary;
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
        name: "",
        owner: "",
        token: "",
        periodTime: BigInt(2592000),
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
    if (!existing) {
      return;
    }

    const totalSalary = await calculateTotalSalary(organization, context);

    const totalDeposits = existing.totalDeposits ? BigInt(existing.totalDeposits) : BigInt(0);
    const totalWithdrawals = existing.totalWithdrawals ? BigInt(existing.totalWithdrawals) : BigInt(0);
    const currentBalance = totalDeposits - totalWithdrawals;

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

const updateOrganizationJoinedList = async (employee: string, organization: string, context: any, event: any) => {
  try {
    const joinedId = `${employee}-${organization}`;

    const orgData = await context.db.find(OrganizationList, { id: organization });

    if (orgData) {
      const existing = await context.db.find(OrganizationJoinedList, { id: joinedId });

      const joinedData = {
        employee: employee,
        organization: organization,
        name: orgData.name,
        owner: orgData.owner,
        token: orgData.token,
        periodTime: orgData.periodTime,
        totalEmployees: orgData.totalEmployees,
        activeEmployees: orgData.activeEmployees,
        totalDeposits: orgData.totalDeposits,
        totalWithdrawals: orgData.totalWithdrawals,
        countDeposits: orgData.countDeposits,
        countWithdraws: orgData.countWithdraws,
        totalSalary: orgData.totalSalary,
        currentBalance: orgData.currentBalance,
        shortfall: orgData.shortfall,
        lastUpdated: event.block.timestamp,
        lastTransaction: event.transaction.hash,
      };

      if (existing) {
        await context.db.update(OrganizationJoinedList, { id: joinedId }).set(joinedData);
      } else {
        await context.db.insert(OrganizationJoinedList).values({
          id: joinedId,
          createdAt: event.block.timestamp,
          ...joinedData,
        });
      }
    }
  } catch (error) {
    throw error;
  }
};

ponder.on("Factory:OrganizationCreated", async ({ event, context }) => {
  try {
    await handleEvent(OrganizationCreated, event, context, {
      owner: event.args.owner,
      organization: event.args.organization,
      name: event.args.name,
      token: event.args.token,
    });

    await updateOrganizationList(event.args.organization, {
      owner: event.args.owner,
      name: event.args.name,
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
      startStream: event.args.startStream,
    });
    await updateEmployeeList(event.log.address, event.args.employee, { 
      salary: event.args.salary 
    }, context, event);

    await updateEmployeeCounts(event.log.address, context, event);
    await updateOrganizationJoinedList(event.args.employee, event.log.address, context, event);
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
    await updateOrganizationJoinedList(event.args.employee, event.log.address, context, event);
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
      startStream: event.args.startStream,
    });

    const employeeId = `${event.log.address}-${event.args.employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    if (existingEmployee && existingEmployee.lastCompensationSalary) {
      const remainingCompensation = existingEmployee.lastCompensationSalary > event.args.amount 
        ? existingEmployee.lastCompensationSalary - event.args.amount 
        : BigInt(0);
      
      await context.db.update(EmployeeList, { id: employeeId }).set({
        lastCompensationSalary: remainingCompensation,
        lastUpdated: Number(event.block.timestamp),
        lastTransaction: event.transaction.hash,
      });
    }

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
      startStream: event.args.startStream,
    });

    const employeeId = `${event.log.address}-${event.args.employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    if (existingEmployee) {
      await context.db.update(EmployeeList, { id: employeeId }).set({
        lastCompensationSalary: BigInt(0),
        lastUpdated: Number(event.block.timestamp),
        lastTransaction: event.transaction.hash,
      });
    }

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

ponder.on("Organization:SetName", async ({ event, context }) => {
  try {
    await handleEvent(SetName, event, context, {
      organization: event.log.address,
      name: event.args.name,
    });

    await updateOrganizationList(event.log.address, {
      name: event.args.name,
    }, context, event);
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:EmployeeSalaryAdded", async ({ event, context }) => {
  try {
    await handleEvent(EmployeeSalaryAdded, event, context, {
      organization: event.log.address,
      name: event.args.name,
      employee: event.args.employee,
      salary: event.args.salary,
      startStream: event.args.startStream,
      timestamp: event.args.timestamp,
      isAutoEarn: event.args.isAutoEarn,
    });
    
    await updateEmployeeList(event.log.address, event.args.employee, {
      name: event.args.name,
      salary: event.args.salary
    }, context, event);

    await updateEmployeeCounts(event.log.address, context, event);
    await updateOrganizationJoinedList(event.args.employee, event.log.address, context, event);
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:EnableAutoEarn", async ({ event, context }) => {
  try {
    await handleEvent(EnableAutoEarn, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      protocol: event.args.protocol,
      amount: event.args.amount,
    });
  } catch (error) {
    throw error;
  }
});

ponder.on("Organization:DisableAutoEarn", async ({ event, context }) => {
  try {
    await handleEvent(DisableAutoEarn, event, context, {
      organization: event.log.address,
      employee: event.args.employee,
      protocol: event.args.protocol,
    });
  } catch (error) {
    throw error;
  }
});
