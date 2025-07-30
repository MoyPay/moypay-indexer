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
      address: "0xC4F36C2cBe0f2B2500b9472619149fbCC96F8669",
      startBlock: 20828190,
    },
    Organization: {
      network: "etherlinkTestnet",
      abi: OrganizationABI,
      address: factory({
        address: "0xC4F36C2cBe0f2B2500b9472619149fbCC96F8669",
        event: FactoryABI.find(item => item.type === "event" && item.name === "OrganizationCreated")!,
        parameter: "organization",
      }),
      startBlock: 20828190,
    },
  },
});
