import { Network } from "zksync/build/types";
import { version as zkSyncLibVersion } from "zksync/package.json";
import { version as zkUIVersion } from "../package.json";
import { ModuleOptions, ZkEthereumNetworkConfig, ZkNetworkConfig, ZkConfig } from "../types";

export const zkSyncNetworkConfig: ZkNetworkConfig = {
  goerli: {
    ethereumNetwork: "goerli",
    api: "http://localhost:3001/",
    explorer: "http://localhost:7001/",
    tools: {
      forcedExit: "https://withdraw-goerli.zksync.dev/",
      link: "https://checkout-goerli.zksync.io/",
      withdrawal: "https://withdraw.zksync.io/",
      mint: "https://mint-goerli.zksync.dev/",
    },
  },
  "goerli-beta": {
    ethereumNetwork: "goerli",
    api: "https://goerli-beta-api.zksync.dev/api/v0.2/",
    explorer: "https://goerli-beta-scan.zksync.dev/",
    tools: {
      forcedExit: "https://withdraw-goerli.zksync.dev/",
      link: "https://checkout-goerli.zksync.io/",
      withdrawal: "https://withdraw.zksync.io/",
      mint: "https://mint-goerli.zksync.dev/",
    },
  },
  mainnet: {
    ethereumNetwork: "mainnet",
    api: "https://api.zksync.io/api/v0.2/",
    explorer: "https://zkscan.io/",
    tools: {
      forcedExit: "https://withdraw.zksync.dev/",
      link: "https://checkout.zksync.io/",
      withdrawal: "https://withdraw.zksync.io/",
      mint: "https://mint.zksync.dev/",
    },
  },
};

export const ethereumNetworkConfig = (INFURA_KEY: string): ZkEthereumNetworkConfig => {
  return {
    goerli: {
      id: 33,
      name: "goerli",
      explorer: "http://localhost:7001/",
      rpc_url: `http://localhost:4444/`,
    },
    mainnet: {
      id: 1,
      name: "mainnet",
      explorer: "https://etherscan.io/",
      rpc_url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
  };
};

export const config = (network: Network, config: ModuleOptions): ZkConfig => {
  const zkSyncNetwork = zkSyncNetworkConfig[network];
  const ethereumNetwork = ethereumNetworkConfig(config.apiKeys.INFURA_KEY)[zkSyncNetwork.ethereumNetwork];
  return {
    zkSyncLibVersion,
    zkUIVersion,
    zkSyncNetwork,
    infuraAPIKey: config.apiKeys.INFURA_KEY,
    ethereumNetwork,
  };
};
