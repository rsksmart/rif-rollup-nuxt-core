import { Network } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ModuleOptions, ZkEthereumNetworkConfig, ZkNetworkConfig, ZkConfig } from "../types";

export const zkSyncLibVersion = "1.0.0";
export const zkUIVersion = "1.0.0";
export const zkSyncNetworkConfig: ZkNetworkConfig = {
  localhost: {
    ethereumNetwork: "localhost",
    api: "http://localhost:3001/api/v0.2/",
    explorer: "http://localhost:7001/",
    tools: {
      forcedExit: "https://withdraw-goerli.zksync.dev/",
      link: "https://checkout-goerli.zksync.io/",
      withdrawal: "https://withdraw.zksync.io/",
      mint: "https://mint-goerli.zksync.dev/",
    },
  },
  testnet: {
    ethereumNetwork: "testnet",
    api: "http://127.0.0.1:3001/api/v0.2/",
    explorer: "http://localhost:7001/",
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
    localhost: {
      id: 33,
      name: "localhost",
      explorer: "https://localhost:7001/",
      rpc_url: "http://localhost:4444",
    },
    testnet: {
      id: 31,
      name: "testnet",
      explorer: "https://explorer.testnet.rsk.co/",
      rpc_url: "https://public-node.testnet.rsk.co",
    },
    mainnet: {
      id: 30,
      name: "mainnet",
      explorer: "https://explorer.rsk.co/",
      rpc_url: "https://public-node.rsk.co",
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
