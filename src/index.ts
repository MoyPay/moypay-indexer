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
  WithdrawBalanceOrganization,
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

const calculateCurrentSalaryBalance = async (organization: string, employee: string, context: any, event: any) => {
  try {
    const employeeId = `${organization}-${employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    if (!existingEmployee || !existingEmployee.status || !existingEmployee.streamingActive) {
      return {
        currentBalance: BigInt(0),
        salaryPerSecond: BigInt(0),
        timeElapsed: 0,
        totalEarned: existingEmployee?.totalEarned || BigInt(0)
      };
    }

    const orgData = await context.db.find(OrganizationList, { id: organization });
    if (!orgData) {
      return {
        currentBalance: BigInt(0),
        salaryPerSecond: BigInt(0),
        timeElapsed: 0,
        totalEarned: existingEmployee.totalEarned || BigInt(0)
      };
    }

    const periodTimeSeconds = orgData.periodTime ? Number(orgData.periodTime) : PERIOD_TIMES.MONTHLY;
    const salaryPerSecond = existingEmployee.salary / BigInt(periodTimeSeconds);
    
    const lastBalanceUpdate = existingEmployee.lastBalanceUpdate || existingEmployee.salaryStreamStartTime || existingEmployee.createdAt;
    const currentTime = event.block.timestamp;
    const timeElapsed = currentTime - lastBalanceUpdate;
    
    // Calculate new earnings since last update
    const newEarnings = salaryPerSecond * BigInt(timeElapsed);
    const previousBalance = existingEmployee.currentSalaryBalance || BigInt(0);
    const currentBalance = previousBalance + newEarnings;
    const totalEarned = (existingEmployee.totalEarned || BigInt(0)) + newEarnings;
    
    return {
      currentBalance,
      salaryPerSecond,
      timeElapsed,
      totalEarned
    };
  } catch (error) {
    return {
      currentBalance: BigInt(0),
      salaryPerSecond: BigInt(0),
      timeElapsed: 0,
      totalEarned: BigInt(0)
    };
  }
};

const calculateUnclaimedSalary = async (organization: string, employee: string, context: any, event: any) => {
  try {
    const balanceData = await calculateCurrentSalaryBalance(organization, employee, context, event);
    return balanceData.currentBalance;
  } catch (error) {
    return BigInt(0);
  }
};

const updateEmployeeSalaryBalance = async (organization: string, employee: string, context: any, event: any) => {
  try {
    const balanceData = await calculateCurrentSalaryBalance(organization, employee, context, event);
    const employeeId = `${organization}-${employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    if (existingEmployee) {
      const totalWithdrawn = existingEmployee.totalWithdrawn || BigInt(0);
      const availableBalance = balanceData.currentBalance - totalWithdrawn;
      
      await context.db.update(EmployeeList, { id: employeeId }).set({
        currentSalaryBalance: balanceData.currentBalance,
        salaryBalanceTimestamp: Number(event.block.timestamp),
        salaryPerSecond: balanceData.salaryPerSecond,
        totalEarned: balanceData.totalEarned,
        availableBalance: availableBalance > BigInt(0) ? availableBalance : BigInt(0),
        lastBalanceUpdate: Number(event.block.timestamp),
        lastUpdated: Number(event.block.timestamp),
        lastTransaction: event.transaction.hash,
      });
    }
  } catch (error) {
    console.error('Error updating employee salary balance:', error);
  }
};

const updateEmployeeList = async (organization: string, employee: string, data: any, context: any, event: any) => {
  const lastUpdateFields: any = {};
  const employeeId = `${organization}-${employee}`;

  try {
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    // Get organization data for period time calculation
    const orgData = await context.db.find(OrganizationList, { id: organization });
    const periodTimeSeconds = orgData?.periodTime ? Number(orgData.periodTime) : PERIOD_TIMES.MONTHLY;

    if (existingEmployee) {
      const wasActive = existingEmployee.status;
      const wasStreamingActive = existingEmployee.streamingActive;
      
      // Update salary balance before making changes
      if (existingEmployee.streamingActive) {
        await updateEmployeeSalaryBalance(organization, employee, context, event);
      }

      if (data.status !== undefined) {
        lastUpdateFields.lastStatusUpdated = event.block.timestamp;
        lastUpdateFields.streamingActive = data.status;
        
        if (wasActive && !data.status) {
          // Employee deactivated - auto-withdraw remaining balance, reset to 0
          const balanceData = await calculateCurrentSalaryBalance(organization, employee, context, event);
          lastUpdateFields.lastCompensationSalary = balanceData.currentBalance;
          lastUpdateFields.streamingActive = false;
          // Reset balance to 0 after auto-withdrawal
          lastUpdateFields.currentSalaryBalance = BigInt(0);
          lastUpdateFields.totalWithdrawn = (existingEmployee.totalWithdrawn || BigInt(0)) + balanceData.currentBalance;
          lastUpdateFields.availableBalance = BigInt(0);
          lastUpdateFields.lastBalanceUpdate = event.block.timestamp;
        } else if (!wasActive && data.status) {
          // Employee reactivated - restart streaming from 0
          lastUpdateFields.lastCompensationSalary = BigInt(0);
          lastUpdateFields.streamingActive = true;
          lastUpdateFields.salaryStreamStartTime = event.block.timestamp;
          lastUpdateFields.currentSalaryBalance = BigInt(0);
          lastUpdateFields.availableBalance = BigInt(0);
          lastUpdateFields.lastBalanceUpdate = event.block.timestamp;
        }
      }
      
      if (data.salary !== undefined) {
        lastUpdateFields.lastSalaryUpdated = event.block.timestamp;
        // Recalculate salary per second when salary changes
        lastUpdateFields.salaryPerSecond = data.salary / BigInt(periodTimeSeconds);
        // Reset streaming start time when salary changes
        lastUpdateFields.salaryStreamStartTime = event.block.timestamp;
        lastUpdateFields.lastBalanceUpdate = event.block.timestamp;
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
      // Create new employee with initial salary balance tracking
      const salary = data.salary || BigInt(0);
      const salaryPerSecond = salary / BigInt(periodTimeSeconds);
      const isActive = data.status !== undefined ? data.status : true;
      
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
        currentSalaryBalance: BigInt(0),
        salaryBalanceTimestamp: event.block.timestamp,
        salaryStreamStartTime: event.block.timestamp,
        salaryPerSecond: salaryPerSecond,
        totalEarned: BigInt(0),
        totalWithdrawn: BigInt(0),
        availableBalance: BigInt(0),
        lastBalanceUpdate: event.block.timestamp,
        streamingActive: isActive,
        ...data,
      };

      await context.db.insert(EmployeeList).values(newEmployeeData);

      await incrementOrganizationCounter(organization, 'totalEmployees', context, event);

      if (isActive) {
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
      unrealizedSalary: event.args.unrealizedSalary,
      isOfframp: event.args.isOfframp,
      startStream: event.args.startStream,
    });

    const employeeId = `${event.log.address}-${event.args.employee}`;
    const existingEmployee = await context.db.find(EmployeeList, { id: employeeId });
    
    if (existingEmployee) {
      // Update salary balance before processing withdrawal
      if (existingEmployee.streamingActive) {
        await updateEmployeeSalaryBalance(event.log.address, event.args.employee, context, event);
      }
      
      // Update withdrawal tracking
      const newTotalWithdrawn = (existingEmployee.totalWithdrawn || BigInt(0)) + event.args.amount;
      const updatedCurrentBalance = (existingEmployee.currentSalaryBalance || BigInt(0));
      const newAvailableBalance = updatedCurrentBalance - newTotalWithdrawn;
      
      // Handle legacy compensation salary tracking
      const remainingCompensation = existingEmployee.lastCompensationSalary && existingEmployee.lastCompensationSalary > event.args.amount 
        ? existingEmployee.lastCompensationSalary - event.args.amount 
        : BigInt(0);
      
      await context.db.update(EmployeeList, { id: employeeId }).set({
        totalWithdrawn: newTotalWithdrawn,
        availableBalance: newAvailableBalance > BigInt(0) ? newAvailableBalance : BigInt(0),
        lastCompensationSalary: remainingCompensation,
        salaryBalanceTimestamp: Number(event.block.timestamp),
        lastBalanceUpdate: Number(event.block.timestamp),
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
      // Update salary balance before processing withdrawal
      if (existingEmployee.streamingActive) {
        await updateEmployeeSalaryBalance(event.log.address, event.args.employee, context, event);
      }
      
      // WithdrawAll should reset everything to 0
      const newTotalWithdrawn = (existingEmployee.totalWithdrawn || BigInt(0)) + event.args.amount;
      
      await context.db.update(EmployeeList, { id: employeeId }).set({
        // Reset all balance tracking since everything is withdrawn
        currentSalaryBalance: BigInt(0),
        totalWithdrawn: newTotalWithdrawn,
        availableBalance: BigInt(0),
        lastCompensationSalary: BigInt(0),
        salaryBalanceTimestamp: Number(event.block.timestamp),
        lastBalanceUpdate: Number(event.block.timestamp),
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

ponder.on("Organization:WithdrawBalanceOrganization", async ({ event, context }) => {
  try {
    await handleEvent(WithdrawBalanceOrganization, event, context, {
      organization: event.log.address,
      amount: event.args.amount,
      isOfframp: event.args.isOfframp,
    });

    // Update organization balance tracking
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
