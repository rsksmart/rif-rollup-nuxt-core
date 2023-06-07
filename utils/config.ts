import { Network } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ModuleOptions, ZkEthereumNetworkConfig, ZkNetworkConfig, ZkConfig } from "../types";

export const zkSyncLibVersion = "1.0.0";
export const zkUIVersion = "1.0.0";
export const zkSyncNetworkConfig: ZkNetworkConfig = {
  localhost: {
    ethereumNetwork: "localhost",
    api: "https://localhost:3001/api/v0.2/",
    explorer: "https://localhost:7001/",
    tools: {
      forcedExit: "https://withdraw-goerli.zksync.dev/",
      link: "https://checkout-goerli.zksync.io/",
      withdrawal: "https://withdraw.zksync.io/",
      mint: "https://mint-goerli.zksync.dev/",
    },
  },
  goerli: {
    ethereumNetwork: "goerli",
    api: "https://goerli-api.zksync.io/api/v0.2/",
    explorer: "https://goerli.zkscan.io/",
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
    localhost: {
      id: 33,
      name: "localhost",
      explorer: "https://localhost:7001/",
      rpc_url: "http://localhost:4444",
    },
    goerli: {
      id: 5,
      name: "goerli",
      explorer: "https://goerli.etherscan.io/",
      rpc_url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
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
