import { createConfig, factory } from "ponder";
import { http } from "viem";
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
      transport: http(process.env.PONDER_RPC_URL_1),
      maxRequestsPerSecond: 5
    },
  },
  contracts: {
    Factory: {
      network: "etherlinkTestnet",
      abi: FactoryABI,
      address: "0x1781b6507a626Eb1385703c7ce2008F795f1EA63",
      startBlock: 20807736,
    },
    Organization: {
      network: "etherlinkTestnet",
      abi: OrganizationABI,
      address: factory({
        address: "0x1781b6507a626Eb1385703c7ce2008F795f1EA63",
        event: FactoryABI.find(item => item.type === "event" && item.name === "OrganizationCreated")!,
        parameter: "organization",
      }),
      startBlock: 20807736,
    },
  },
});
