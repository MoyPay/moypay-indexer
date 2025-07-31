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
      address: "0x7f8D91193c7a66ABE2FE69a90212269bBE9694C3",
      startBlock: 20842467,
    },
    Organization: {
      network: "etherlinkTestnet",
      abi: OrganizationABI,
      address: factory({
        address: "0x7f8D91193c7a66ABE2FE69a90212269bBE9694C3",
        event: FactoryABI.find(item => item.type === "event" && item.name === "OrganizationCreated")!,
        parameter: "organization",
      }),
      startBlock: 20842467,
    },
  },
});
