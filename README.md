# MoyPay Indexer

![Ponder Logo](./public/logo-ponder.png)

A sophisticated blockchain indexing system built with [Ponder](https://ponder.sh) that tracks real-time salary streaming and DeFi yield farming for organizations on the Core testnet. This indexer provides comprehensive tracking of payroll operations, employee management, and automated earning protocols.

## 🚀 Features

- **Real-time Salary Streaming**: Track continuous salary accrual for employees
- **Organization Management**: Monitor multiple organizations with their employees
- **DeFi Integration**: Support for automated yield earning protocols
- **Employee Lifecycle**: Complete employee onboarding, salary changes, status updates
- **Financial Tracking**: Deposits, withdrawals, balance calculations
- **GraphQL API**: Query blockchain data with a powerful GraphQL interface
- **REST API**: Additional REST endpoints for data access

## 📊 Architecture

### Smart Contracts

1. **Factory Contract** (`0x565Da780F19E7034887a2aD0200295eA42a85998`)
   - Creates new organization contracts
   - Manages earn protocols registry
   - Tracks all organizations

2. **Organization Contracts** (Dynamic addresses)
   - Individual payroll management per organization
   - Employee salary streaming
   - DeFi protocol integration
   - Treasury management

### Database Schema

The indexer tracks multiple entities:

- **Organizations**: Company profiles, settings, financials
- **Employees**: Personal info, salary details, earnings history
- **Transactions**: All payroll-related blockchain events
- **Auto-Earn**: DeFi protocol participation tracking

## 🛠 Installation

### Prerequisites

- Node.js ≥ 18.14
- pnpm (recommended) or npm
- PostgreSQL (optional, SQLite used by default)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd indexer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   PONDER_RPC_URL_1=https://rpc.ankr.com/core_testnet
   PONDER_RPC_URL_2=https://node.ghostnet.core.com
   PONDER_LOG_LEVEL=info
   
   # Optional: PostgreSQL database
   DATABASE_URL=postgresql://user:password@localhost:5432/database
   DATABASE_SCHEMA=public
   ```

4. **Start the indexer**
   ```bash
   pnpm dev
   ```

## 📋 Available Scripts

```bash
# Development
pnpm dev          # Start development server with hot reload
pnpm start        # Start production server

# Database
pnpm db           # Database management commands

# Code Generation
pnpm codegen      # Generate TypeScript types from schema

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format code with Prettier
pnpm format:check # Check code formatting
pnpm typecheck    # Run TypeScript type checking

# Combined Commands
pnpm check        # Run format:check + lint + typecheck
pnpm fix          # Run format + lint:fix
```

## 🔄 Real-Time Salary Calculation

The core feature of this indexer is real-time salary streaming calculation:

```typescript
currentSalaryBalance = previousBalance + (salaryPerSecond * timeElapsed)
```

### Components:
- **previousBalance**: Last calculated salary balance
- **salaryPerSecond**: Employee's salary divided by period time (daily/weekly/monthly/yearly)
- **timeElapsed**: Time elapsed since last balance update (in seconds)

### Salary Periods:
- **Daily**: 86,400 seconds
- **Weekly**: 604,800 seconds  
- **Monthly**: 2,592,000 seconds (default)
- **Yearly**: 31,536,000 seconds

### Calculation Triggers:
- Employee status changes
- Salary adjustments
- Withdrawal operations
- Organization period time changes
- Auto-earn protocol interactions

## 📡 API Endpoints

### GraphQL API
```
GET  /          # GraphQL Playground
POST /graphql   # GraphQL endpoint
```

### REST API
```
GET /sql/*      # SQL-based queries
```

### Example Queries

**Get Organization Details:**
```graphql
query GetOrganization($id: String!) {
  OrganizationList(id: $id) {
    name
    owner
    token
    totalEmployees
    activeEmployees
    currentBalance
    totalSalary
  }
}
```

**Get Employee Salary Info:**
```graphql
query GetEmployee($id: String!) {
  EmployeeList(id: $id) {
    name
    salary
    currentSalaryBalance
    totalEarned
    totalWithdrawn
    status
    autoEarnStatus
  }
}
```

## 🔍 Tracked Events

### Factory Events
- `OrganizationCreated`: New organization deployment
- `EarnProtocolAdded/Removed`: Protocol registry updates

### Organization Events
- `EmployeeSalaryAdded`: New employee onboarding
- `EmployeeSalarySet`: Salary updates
- `EmployeeStatusChanged`: Active/inactive status
- `Deposit`: Organization funding
- `Withdraw/WithdrawAll`: Employee salary withdrawals
- `EnableAutoEarn/DisableAutoEarn`: DeFi protocol participation
- `EarnSalary`: Yield farming rewards
- `PeriodTimeSet`: Salary period changes
- `SetName/SetEmployeeName`: Name updates

## 🏗 Data Models

### Core Entities

**OrganizationList**
- Basic info (name, owner, token)
- Financial metrics (balance, deposits, withdrawals)
- Employee counts (total, active)
- Salary calculations (total salary, shortfall)

**EmployeeList** 
- Personal details (name, address)
- Salary info (amount, per-second rate)
- Balance tracking (current, available, earned, withdrawn)
- Status flags (active, streaming, auto-earn)

**EmployeeAutoEarn**
- DeFi protocol participation
- Shares and earnings tracking
- Enable/disable timestamps

## 🌐 Network Configuration

**Core Testnet**
- Chain ID: 1114
- RPC Endpoints: 
  - Primary: `https://rpc.ankr.com/core_testnet`
  - Fallback: `https://node.ghostnet.core.com`
- Start Block: 20,862,743
- Polling Interval: 2 seconds
- Rate Limit: 3 requests/second

## 🔧 Development

### Code Structure
```
├── src/
│   ├── index.ts          # Main event handlers
│   └── api/
│       └── index.ts      # API configuration
├── abis/                 # Smart contract ABIs
├── ponder.config.ts      # Ponder configuration
├── ponder.schema.ts      # Database schema
└── ponder-env.d.ts       # TypeScript definitions
```

### Key Functions
- `calculateCurrentSalaryBalance()`: Real-time salary computation
- `updateEmployeeList()`: Employee data management
- `updateOrganizationList()`: Organization metrics
- `handleEvent()`: Generic event processing
- `recalculateOrganizationMetrics()`: Financial recalculation

## 📈 Monitoring

The indexer provides comprehensive logging and can be monitored through:
- Real-time event processing logs
- Database query performance
- RPC endpoint health
- Salary calculation accuracy

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## 📝 License

This project is part of a hackathon submission for Core ecosystem development.

## 🔗 Related Links

- [Ponder Documentation](https://ponder.sh)
- [Core Documentation](https://docs.core.com)
- [GraphQL Documentation](https://graphql.org)

