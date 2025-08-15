import { createConfig, factory } from "ponder";
import { http, fallback } from "viem";
import { FactoryABI } from "./abis/factory.abi";
import { OrganizationABI } from "./abis/organization.abi";

export default createConfig({
  // database: {
  //   kind: "postgres",
  //   connectionString: process.env.PONDER_DATABASE_URL,
  // },
  networks: {
    coreTestnet: {
      chainId: 1114,
      transport: fallback([
        http(process.env.PONDER_RPC_URL_1, {
          retryCount: 2,
          retryDelay: 1000,
        }),
        http(process.env.PONDER_RPC_URL_2, {
          retryCount: 2,
          retryDelay: 1000,
        }),
      ]),
      maxRequestsPerSecond: 3,
      pollingInterval: 2000,
    },
  },
  contracts: {
    Factory: {
      network: "coreTestnet",
      abi: FactoryABI,
      address: "0x287C0fd28AB921f4f05Eb8326b809Ac2F9A817aa",
      startBlock: 7346994,
    },
    Organization: {
      network: "coreTestnet",
      abi: OrganizationABI,
      address: factory({
        address: "0x287C0fd28AB921f4f05Eb8326b809Ac2F9A817aa",
        event: FactoryABI.find(
          item => item.type === "event" && item.name === "OrganizationCreated"
        )!,
        parameter: "organization",
      }),
      startBlock: 7346994,
    },
  },
});
