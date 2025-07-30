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
    etherlinkTestnet: {
      chainId: 128123,
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
      network: "etherlinkTestnet",
      abi: FactoryABI,
      address: "0xeF323bcBE6bb509F0b6F89b06fc7a17a012515E4",
      startBlock: 20819946,
    },
    Organization: {
      network: "etherlinkTestnet",
      abi: OrganizationABI,
      address: factory({
        address: "0xeF323bcBE6bb509F0b6F89b06fc7a17a012515E4",
        event: FactoryABI.find(item => item.type === "event" && item.name === "OrganizationCreated")!,
        parameter: "organization",
      }),
      startBlock: 20819946,
    },
  },
});
