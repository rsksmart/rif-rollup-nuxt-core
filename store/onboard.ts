/* eslint-disable require-await */
import type { GetterTree, MutationTree, ActionTree } from "vuex";

import Onboard from "@web3-onboard/core";
import type { OnboardAPI } from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import type { IConnector } from "@walletconnect/types";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { ethers } from "ethers";
import type { JsonRpcError } from "json-rpc-engine";
import { Wallet, RemoteWallet, RestProvider } from "@rsksmart/rif-rollup-js-sdk";
import type { ExternalProvider } from "@ethersproject/providers";
import { Address } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { config, ethereumNetworkConfig, zkSyncNetworkConfig } from "../utils/config";
import { ModuleOptions, ZkOnboardStatus, ZkLoginOptions, ZkEthereumNetwork, ZkEthereumNetworkConfig, ZkConfig } from "../types";
import { isMobileDevice } from "../utils";

const loginOptionsDefaults: ZkLoginOptions = {
  requireSigner: false,
  requestAccountState: true,
  autoUpdateAccountState: true,
  requestTransactionHistory: true,
};

let onboard: OnboardAPI | undefined;
let onboardWalletUpdatesUnsubscribe: () => void | undefined;
let ethereumProvider: ExternalProvider | undefined;
let web3Provider: ethers.providers.Web3Provider | undefined;
let wc1Provider: WalletConnectProvider | undefined;
let networkChange = {
  resolve: <((result: boolean) => void) | undefined>undefined,
  reject: <((result: boolean) => void) | undefined>undefined,
};

const getWalletName = () => {
  const wcName = (onboard?.state.get().wallets[0].provider as any)?.connector?.peerMeta?.name;
  if (wcName === "Argent") {
    return "Argent";
  }
  return onboard?.state.get().wallets[0].label;
};

export type OnboardState = {
  loginOptions: ZkLoginOptions;
  selectedWallet?: string;
  loadingHint?: string;
  wrongNetwork: boolean;
  options: ModuleOptions;
  onboardTheme: "light" | "dark";
  onboardInited: boolean;
  onboardStatus: ZkOnboardStatus;
  restoringSession: boolean;
  error: string;
  forceUpdateValue: number;
};

export const state = (options: ModuleOptions): OnboardState => ({
  loginOptions: loginOptionsDefaults,
  selectedWallet: undefined,
  loadingHint: undefined,
  wrongNetwork: false,
  options,
  onboardTheme: "light",
  onboardInited: false,
  onboardStatus: "initial",
  restoringSession: false,
  error: "",
  forceUpdateValue: Number.MIN_SAFE_INTEGER,
});

export const getters: GetterTree<OnboardState, OnboardState> = {
  loginOptions: (state) => state.loginOptions,
  selectedWallet: (state) => state.selectedWallet,
  loadingHint: (state) => state.loadingHint,
  wrongNetwork: (state) => state.wrongNetwork,
  onboard: (state) => {
    // eslint-disable-next-line no-unused-expressions
    state.forceUpdateValue;
    return onboard;
  },
  options: (state) => state.options,
  onboardStatus: (state) => state.onboardStatus,
  onboardInited: (state) => state.onboardInited,
  restoringSession: (state) => state.restoringSession,
  error: (state) => state.error,
  wcProvider: (state) => {
    // eslint-disable-next-line no-unused-expressions
    state.forceUpdateValue;
    if (wc1Provider) {
      return wc1Provider.connector;
    }
    if ((ethereumProvider as any)?.connector?.protocol !== "wc") {
      return;
    }
    return (ethereumProvider as any)?.connector as IConnector;
  },
  ethereumProvider: (state) => {
    // eslint-disable-next-line no-unused-expressions
    state.forceUpdateValue;
    return ethereumProvider;
  },
  web3Provider: (state) => {
    // eslint-disable-next-line no-unused-expressions
    state.forceUpdateValue;
    return web3Provider;
  },
  wc1Provider: (state) => {
    // eslint-disable-next-line no-unused-expressions
    state.forceUpdateValue;
    return wc1Provider;
  },
  ethereumNetworksConfig: (state) => ethereumNetworkConfig(state.options.apiKeys.INFURA_KEY),
  config: (state, _, __, rootGetters) => config(rootGetters["zk-provider/network"], state.options),
};

export const mutations: MutationTree<OnboardState> = {
  setLoginOptions: (state, loginOptions?: ZkLoginOptions) => {
    state.loginOptions = Object.assign(loginOptionsDefaults, loginOptions);
  },
  setSelectedWallet: (state, walletName?: string) => {
    state.selectedWallet = walletName;
    if (walletName) {
      localStorage.setItem("lastSelectedWallet", walletName);
    } else {
      localStorage.removeItem("lastSelectedWallet");
    }
  },
  setLoadingHint: (state, loadingHint: string) => (state.loadingHint = loadingHint),
  setWrongNetwork: (state, wrongNetwork: boolean) => (state.wrongNetwork = wrongNetwork),
  setOnboard: (state, onboardInstance: OnboardAPI) => {
    state.forceUpdateValue++;
    onboard = onboardInstance;
  },
  setOnboardTheme: (state, theme: "light" | "dark") => {
    state.onboardTheme = theme;
    if (onboard) {
      onboard.state.actions.updateTheme(theme);
    }
  },
  setOnboardStatus: (state, status: ZkOnboardStatus) => (state.onboardStatus = status),
  setOnboardInited: (state, status: boolean) => (state.onboardInited = status),
  setRestoringSession: (state, status: boolean) => (state.restoringSession = status),
  setError: (state, error: string) => (state.error = error),
  setEthereumProvider: (state, ethProvider: ExternalProvider) => {
    ethereumProvider = ethProvider;
    state.forceUpdateValue++;
  },
  setWeb3Provider: (state, ethWeb3Provider: ethers.providers.Web3Provider) => {
    web3Provider = ethWeb3Provider;
    state.forceUpdateValue++;
  },
  clear: (state) => {
    state.selectedWallet = undefined;
    state.loadingHint = undefined;
    networkChange = {
      resolve: undefined,
      reject: undefined,
    };
    ethereumProvider = undefined;
    state.forceUpdateValue++;
  },
};

export const actions: ActionTree<OnboardState, OnboardState> = {
  async onboardInit({ state, commit, getters }) {
    commit(
      "setOnboard",
      Onboard({
        theme: state.onboardTheme,
        wallets: [
          injectedModule(),
          walletConnectModule({
            version: 2,
            projectId: "c37c6a422d315bf55a0c39000960afa4",
            requiredChains: [30, 31], //rsk mainnet/testnet
            dappUrl: location.toString(),
            additionalOptionalMethods: ["eth_sendTransaction", "eth_signTransaction", "personal_sign", "eth_sign", "eth_signTypedData", "eth_signTypedData_v4"],
          }),
        ],
        chains: Object.entries(getters.ethereumNetworksConfig as ZkEthereumNetworkConfig).map(([key, value]) => ({
          id: "0x" + value.id.toString(16),
          token: "RBTC",
          label: key,
          rpcUrl: value.rpc_url,
        })),
        appMetadata: {
          name: "rifRollup",
          // eslint-disable-next-line quotes
          icon: `<svg width="111" height="109" viewBox="0 0 111 109" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M105.307 58.1332L99.7157 54.5059L105.311 50.8741C108.872 48.5646 111 44.647 111 40.3988C111 36.1506 108.872 32.2374 105.311 29.9234L62.2799 2.00852C58.1616 -0.67174 52.8384 -0.667272 48.7156 2.00852L5.69345 29.9234C2.13281 32.2329 0.00446184 36.1506 0.00446184 40.3988C0.00446184 44.2271 1.73124 47.7739 4.67613 50.1326L11.3111 54.4835L5.68899 58.1287C2.12835 60.4382 0 64.3558 0 68.604C0 72.4323 1.72678 75.9792 4.67166 78.3378L21.2791 89.2242L21.2969 89.2108L48.7067 106.999C50.7681 108.334 53.1285 109 55.4888 109C57.8492 109 60.2096 108.33 62.271 106.999L81.9527 94.2273L82.1356 94.1112L89.6808 89.2152L105.298 79.0838C108.858 76.7744 110.987 72.8567 110.987 68.6085C110.987 64.3603 108.858 60.4471 105.298 58.1332H105.307ZM10.7221 43.1103C9.39241 42.2481 9.24963 40.9259 9.24963 40.3988C9.24963 39.8716 9.39241 38.5449 10.7221 37.6872L53.7487 9.76787C54.8196 9.07547 56.1938 9.07547 57.2602 9.76787L100.282 37.6872C101.612 38.5494 101.755 39.8716 101.755 40.3988C101.755 40.9259 101.612 42.2481 100.282 43.1103L91.2202 48.9935L62.2844 30.2182C58.166 27.538 52.8429 27.5425 48.7201 30.2182L19.7843 48.9935L10.7265 43.1148L10.7221 43.1103ZM82.7291 54.5014L57.2558 71.0297C56.1894 71.7265 54.8106 71.7221 53.7442 71.0297L28.2754 54.5014L53.7487 37.9687C54.8196 37.2763 56.1938 37.2763 57.2602 37.9687L82.7291 54.4969V54.5014ZM100.282 71.3156L57.2602 99.2394C56.1938 99.9363 54.8151 99.9318 53.7487 99.2394L10.7265 71.32C9.39687 70.4579 9.25409 69.1356 9.25409 68.6085C9.25409 68.0814 9.39687 66.7546 10.7265 65.897L19.7709 60.0272L21.288 61.0234L21.3058 61.01L48.7156 78.7979C50.777 80.1336 53.1374 80.7992 55.4978 80.7992C57.8581 80.7992 60.2185 80.1291 62.2799 78.7979L81.9616 66.0265L82.1446 65.9104L89.6897 61.0144L91.2202 60.0227L100.282 65.9014C101.612 66.7636 101.755 68.0858 101.755 68.613C101.755 69.1401 101.612 70.4623 100.282 71.3245V71.3156Z" fill="black"/></svg>`,
          logo: "https://firebasestorage.googleapis.com/v0/b/testing-30533.appspot.com/o/rollup_black.svg?alt=media&token=ca3d8ee4-eb3a-4e3b-aa39-3bad352ba03e",
          description: "RIF Rollup - Rely on math, not validators",
          recommendedInjectedWallets: [{ name: "MetaMask", url: "https://metamask.io" }],
        },
        accountCenter: {
          desktop: {
            enabled: false,
          },
          mobile: {
            enabled: false,
          },
        },
      }),
    );

    if (window && window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }
    commit("setOnboardInited", true);
  },
  async getLastLoginData({ commit }) {
    const lastSelectedWallet = localStorage.getItem("lastSelectedWallet");
    if (lastSelectedWallet) {
      commit("setSelectedWallet", lastSelectedWallet);
    }
  },
  async walletCheck({ dispatch }) {
    if (!onboard) {
      console.warn("Onboard wasn't initialized with zk-onboard/onboardInit");
      return false;
    }
    return await dispatch("checkRightNetwork");
  },
  async onAddressChange({ getters, commit, dispatch, rootGetters }, { address }: { address: Address }) {
    // Was logged in
    if (rootGetters["zk-account/address"] && rootGetters["zk-account/address"]?.toLowerCase() !== address.toLowerCase()) {
      commit("setLoadingHint", "Switching accounts...");
      commit("setOnboardStatus", "connecting");
      await dispatch("zk-account/clearAccountData", null, { root: true });
      if (getters.selectedWallet === "Argent") {
        await dispatch("loginWithWC1");
      } else {
        await dispatch("loginWithOnboard", getters.selectedWallet);
      }
    }
  },
  async accountSelect() {
    if (!onboard) {
      console.warn("Onboard wasn't initialized with zk-onboard/onboardInit");
      return false;
    }
    /* return await onboard.accountSelect(); */
  },
  async reset({ commit, dispatch }) {
    dispatch("wc1Disconnect");
    commit("setOnboardStatus", "initial");
    commit("setSelectedWallet", undefined);
    localStorage.removeItem("walletconnect");
    onboardWalletUpdatesUnsubscribe && onboardWalletUpdatesUnsubscribe();
    if (onboard?.state.get()?.wallets.length) {
      const [primaryWallet] = onboard.state.get().wallets;
      await onboard.disconnectWallet({ label: primaryWallet.label });
    }
  },
  async rejectNetworkChange({ commit }) {
    commit("setWrongNetwork", false);
    if (networkChange.reject) {
      networkChange.reject(true);
    }
  },
  async loginWithArgent({ commit, dispatch }) {
    commit("setSelectedWallet", "Argent");
    return await dispatch("loginWithWC1");
  },
  async loginWithWalletConnect({ commit, dispatch }) {
    commit("setSelectedWallet", undefined);
    return await dispatch("loginWithOnboard", "WalletConnect");
  },
  async checkRightNetwork({ getters, commit }) {
    try {
      await new Promise((resolve, reject) => {
        networkChange.resolve = resolve;
        networkChange.reject = reject;

        const network = getters.config.ethereumNetwork as ZkEthereumNetwork;
        const walletChainId = wc1Provider?.chainId ?? parseInt(onboard?.state.get().wallets[0].chains[0].id ?? "", 16);
        if (walletChainId === network.id) {
          commit("setWrongNetwork", false);
          return resolve(true);
        }
        commit("setWrongNetwork", true);

        const isWC = !!wc1Provider || (onboard?.state.get().wallets[0].provider as any)?.connector?.protocol === "wc";
        if (isWC) {
          return reject(new Error("WalletConnect does not support network switching"));
        }

        if (onboard) {
          const chainId = ethers.utils.hexValue(network.id);
          onboard.state
            .get()
            .wallets[0].provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId }],
            })
            .then(() => {
              commit("setWrongNetwork", false);
              resolve(true);
            })
            .catch((switchError: any) => {
              if (!switchError) {
                return reject(new Error("Unable to switch network"));
              }

              if ((switchError as JsonRpcError).code !== 4902 && (switchError as any).data?.originalError?.code !== 4902) {
                return reject(switchError);
              }

              if (!onboard) {
                return reject(new Error("Onboard not initialized"));
              }
              onboard.state
                .get()
                .wallets[0].provider.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId,
                      chainName: network.name.charAt(0).toUpperCase() + network.name.slice(1),
                      nativeCurrency: {
                        name: "Ether",
                        symbol: "RBTC",
                        decimals: 18,
                      },
                      rpcUrls: [network.rpc_url],
                      blockExplorerUrls: [network.rpc_url],
                      iconUrls: ["https://rootstock.io/favicon-32x32.png"],
                    },
                  ],
                })
                .then(() => {
                  commit("setWrongNetwork", false);
                  resolve(true);
                });
            });
        }
      });
      return true;
    } catch (err) {
      console.warn("checkRightNetwork error: \n", err);
      return false;
    }
  },
  async subscribeForOnboardWalletUpdates({ getters, commit, dispatch }) {
    const state = onboard!.state.select("wallets");
    const { unsubscribe } = state.subscribe(async (wallets) => {
      if (!wallets.length) {
        commit("setSelectedWallet", undefined);
        dispatch("zk-account/logout", null, { root: true });
        if (getters.options.logoutRedirect) {
          this.$router.push(getters.options.logoutRedirect);
        }
        return;
      }
      // @ts-ignore
      wallets[0].provider.autoRefreshOnNetworkChange = false;
      commit("setSelectedWallet", wallets[0].label);
      await dispatch("onAddressChange", { address: wallets[0].accounts[0].address });
    });
    onboardWalletUpdatesUnsubscribe = () => {
      try {
        unsubscribe();
      } catch (_) {}
    };
  },
  async loginWithOnboard({ getters, commit, dispatch }, walletName?: string) {
    if (!getters.onboardInited) {
      await dispatch("onboardInit");
    }
    if (!onboard!.state.get().wallets.length) {
      await onboard!.connectWallet(
        walletName
          ? {
              autoSelect: { label: walletName, disableModals: true },
            }
          : undefined,
      );
    }
    const wallets = onboard!.state.get().wallets;
    if (!wallets.length) {
      return dispatch("reset");
    } else if (getWalletName() === "Argent") {
      commit("setError", "Use Argent Connect button instead");
      return dispatch("reset");
    }
    dispatch("subscribeForOnboardWalletUpdates");
    commit("setSelectedWallet", getWalletName());
    const disabledWallet = (getters.options as ModuleOptions).disabledWallets!.find((e) => e.name === getters.selectedWallet);
    if (disabledWallet) {
      commit("setError", disabledWallet.error);
      return dispatch("reset");
    }
    const checkResult = await dispatch("walletCheck");
    if (!checkResult) {
      return dispatch("reset");
    }
    return await dispatch("login", wallets[0].provider);
  },
  async loginWithWC1({ commit, dispatch, getters }) {
    const projectConfig: ZkConfig = getters.config;
    wc1Provider = new WalletConnectProvider({
      infuraId: projectConfig.infuraAPIKey,
      pollingInterval: 10000,
      qrcode: !(getters.selectedWallet === "Argent" && isMobileDevice()),
      chainId: projectConfig.ethereumNetwork.id,
      qrcodeModalOptions:
        getters.selectedWallet === "Argent"
          ? {
              mobileLinks: ["argent"],
            }
          : {},
    });

    try {
      if (!wc1Provider) {
        throw new Error("Provider not found");
      }

      wc1Provider.connector.on("display_uri", (err, _) => {
        if (err) {
          return console.warn("providerWalletConnect.connector display_uri error\n", err);
        }
        if (getters.selectedWallet === "Argent" && isMobileDevice()) {
          dispatch("zk-wallet/openWalletApp", null, { root: true });
        }
      });

      wc1Provider.on("accountsChanged", async (accounts: string[]) => {
        await dispatch("onAddressChange", { address: accounts[0] });
      });

      wc1Provider.on("chainChanged", (chainId: number) => {
        if (networkChange.resolve && chainId === (<ZkConfig>getters.config).ethereumNetwork.id) {
          networkChange.resolve(true);
        }
      });

      await wc1Provider.enable();
      if (wc1Provider.walletMeta?.name !== "Argent") {
        throw new Error(`To use "${wc1Provider.walletMeta?.name}" use WalletConnect button instead`);
      }
      commit("setSelectedWallet", wc1Provider.walletMeta?.name);
      if (wc1Provider.chainId !== (<ZkConfig>getters.config).ethereumNetwork.id) {
        commit("setWrongNetwork", true);
        try {
          await new Promise((resolve, reject) => {
            networkChange.resolve = resolve;
            networkChange.reject = reject;
          });
          return await dispatch("login", wc1Provider);
        } catch (_) {
          return false;
        } finally {
          commit("setWrongNetwork", false);
        }
      } else {
        return await dispatch("login", wc1Provider);
      }
    } catch (error) {
      console.warn("walletConnectLogin error: \n", error);
      commit("setError", error);
      await dispatch("reset");
      return false;
    }
  },
  async login({ getters, commit, dispatch }, ethProvider?: ExternalProvider) {
    if (!ethProvider) {
      return dispatch("reset");
    }
    const options: ZkLoginOptions = getters.loginOptions;
    /* zkSync log in process */
    commit("setEthereumProvider", ethProvider);
    commit("setLoadingHint", "Processing...");
    commit("setOnboardStatus", "connecting");
    let syncProvider: RestProvider;
    try {
      syncProvider = await dispatch("zk-provider/requestProvider", null, { root: true });
    } catch (error) {
      dispatch("zk-account/logout", null, { root: true });
      return dispatch("reset");
    }
    web3Provider = new ethers.providers.Web3Provider(ethProvider, "any");
    commit("setWeb3Provider", web3Provider);
    const ethWallet = web3Provider.getSigner();
    if (options.requireSigner) {
      commit("setLoadingHint", "Follow the instructions in your Ethereum wallet");
    }
    let syncWallet: Wallet | RemoteWallet | undefined;
    if (getters.selectedWallet === "Argent") {
      commit("zk-wallet/setRemoteWallet", true, { root: true });
      syncWallet = await RemoteWallet.fromEthSigner(web3Provider, syncProvider);
    } else {
      syncWallet = await Wallet[options.requireSigner ? "fromEthSigner" : "fromEthSignerNoKeys"](ethWallet, syncProvider);
      commit("zk-wallet/setRemoteWallet", false, { root: true });
    }
    if (!syncWallet) {
      return dispatch("reset");
    }
    commit("setLoadingHint", "Getting wallet information...");

    /* Set account data */
    commit("zk-account/setAddress", syncWallet.address(), { root: true });
    commit("zk-wallet/setSyncWallet", syncWallet, { root: true });
    commit("zk-account/setLoggedIn", true, { root: true });

    /* Get needed initial data */
    dispatch("zk-account/setInitialName", null, { root: true });
    if (options.requestAccountState) {
      dispatch("zk-account/updateAccountState", null, { root: true });
      dispatch("zk-wallet/checkCPK", null, { root: true });
    }
    if (options.autoUpdateAccountState) {
      dispatch("zk-account/autoUpdateAccountState", 30000, { root: true });
    }
    if (options.requestTransactionHistory) {
      dispatch("zk-history/getTransactionHistory", null, { root: true });
    }
    dispatch("zk-tokens/loadZkTokens", null, { root: true });
    dispatch("zk-contacts/requestContacts", null, { root: true });

    commit("setOnboardStatus", "authorized");
    return true;
  },
  async restoreLastNetwork({ commit }) {
    const lastSelectedNetwork = localStorage.getItem("lastSelectedNetwork");
    if (lastSelectedNetwork && Object.prototype.hasOwnProperty.call(zkSyncNetworkConfig, lastSelectedNetwork)) {
      commit("zk-provider/setNetwork", lastSelectedNetwork, { root: true });
    }
  },
  async restoreLogin({ getters, commit, dispatch }) {
    commit("setRestoringSession", true);
    commit("setLoadingHint", "Restoring session...");
    if (getters.options.restoreNetwork) {
      await dispatch("restoreLastNetwork");
    }
    await dispatch("getLastLoginData");
    let loginResult = false;
    if (getters.selectedWallet === "Argent") {
      loginResult = await dispatch("loginWithWC1");
    } else {
      loginResult = await dispatch("loginWithOnboard", getters.selectedWallet);
    }
    commit("setRestoringSession", false);
    return loginResult;
  },
  async wc1Disconnect() {
    try {
      if (wc1Provider && (wc1Provider.isConnecting || wc1Provider.connected) && wc1Provider.disconnect) {
        await wc1Provider.disconnect();
      }
      wc1Provider = undefined;
    } catch (error) {
      console.warn("Error disconnecting from WalletConnect v1\n", error);
    }
  },
};

export default (options: ModuleOptions) => ({
  namespaced: true,
  state: state(options),
  getters,
  mutations,
  actions,
});
