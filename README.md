# Indexer with Ponder

![Ponder Logo](./public/logo-ponder.png)

## Overview

## Real-Time Incremental Salary Calculation Formula

The real-time incremental salary is calculated based on the following formula:

```
currentSalaryBalance = previousBalance + (salaryPerSecond * timeElapsed)
```

- **previousBalance**: The last calculated salary balance.
- **salaryPerSecond**: The employee's calculated salary per second.
- **timeElapsed**: The time elapsed since the last balance update, in seconds.

Each increment of salary is computed considering real-time updates and triggered by various events such as status changes or salary adjustments.
