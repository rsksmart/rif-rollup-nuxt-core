import { Network } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ModuleOptions, ZkEthereumNetworkConfig, ZkNetworkConfig, ZkConfig } from "../types";

export const zkSyncLibVersion = "1.0.0";
export const zkUIVersion = "1.0.0";
export const zkSyncNetworkConfig: ZkNetworkConfig = {
  localhost: {
    ethereumNetwork: "localhost",
    api: "http://localhost:3001/api/v0.2/",
    rollupExplorer: "http://localhost:7000/",
    tools: {
      forcedExit: "http://localhost:3000/",
      link: "http://localhost:3000/",
      withdrawal: "http://localhost:3000/",
      mint: "http://localhost:3000/",
    },
  },
  testnet: {
    ethereumNetwork: "testnet",
    api: "https://dev.aggregation.rifcomputing.net:3029/api/v0.2/",
    rollupExplorer: "https://explorer.testnet.rollup.rif.technology/",
    tools: {
      forcedExit: "https://wallet.dev.aggregation.rifcomputing.net/transaction/withdraw/",
      link: "https://checkout.dev.aggregation.rifcomputing.net/",
      withdrawal: "https://wallet.dev.aggregation.rifcomputing.net/transaction/withdraw/",
      mint: "https://wallet.dev.aggregation.rifcomputing.net/transaction/deposit/",
    },
  },
  mainnet: {
    ethereumNetwork: "mainnet",
    api: "https://api.zksync.io/api/v0.2/",
    rollupExplorer: "https://zkscan.io/",
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
      rskExplorer: "http://not.Available.In.LocalHost/",
      rpc_url: "http://localhost:4444",
    },
    testnet: {
      id: 31,
      name: "testnet",
      rskExplorer: "https://explorer.testnet.rsk.co/",
      rpc_url: "https://public-node.testnet.rsk.co",
    },
    mainnet: {
      id: 30,
      name: "mainnet",
      rskExplorer: "https://explorer.rsk.co/",
      rpc_url: "https://public-node.rsk.co",
    },
  };
};

export const config = (network: Network, config: ModuleOptions): ZkConfig => {
  const zkSyncNetwork = zkSyncNetworkConfig[network];
    //override values if necessary
  if (config.rollupServerURLs?.[network]) {
    zkSyncNetwork.api = config.rollupServerURLs[network];
  }

  const ethereumNetwork = ethereumNetworkConfig(config.apiKeys.INFURA_KEY)[zkSyncNetwork.ethereumNetwork];
  return {
    zkSyncLibVersion,
    zkUIVersion,
    zkSyncNetwork,
    infuraAPIKey: config.apiKeys.INFURA_KEY,
    ethereumNetwork,
  };
};
