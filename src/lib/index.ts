import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { NetworkInfo } from "@aptos-labs/wallet-adapter-core";

export const aptosClient = (network?: NetworkInfo | null) => {
  if (network?.name === Network.DEVNET) {
    return DEVNET_CLIENT;
  } else if (network?.name === Network.TESTNET) {
    return TESTNET_CLIENT;
  } else if (network?.name === Network.MAINNET) {
    throw new Error("Please use devnet or testnet for testing");
  } else {
    const CUSTOM_CONFIG = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: network?.url,
    });
    return new Aptos(CUSTOM_CONFIG);
  }
};

// Devnet client
export const DEVNET_CONFIG = new AptosConfig({
  network: Network.DEVNET,
});
export const DEVNET_CLIENT = new Aptos(DEVNET_CONFIG);

// Testnet client
export const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
export const TESTNET_CLIENT = new Aptos(TESTNET_CONFIG);

export const isSendableNetwork = (
  connected: boolean,
  networkName?: string,
): boolean => {
  return connected && isMainnet(connected, networkName);
};

export const isMainnet = (
  connected: boolean,
  networkName?: string,
): boolean => {
  return connected && networkName === Network.MAINNET;
};

export const toHexString = (byteArray: { [key: string]: number }) => {
  if (!byteArray || typeof byteArray !== 'object') return '';
  const bytes = Object.values(byteArray);
  return '0x' + bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export function conditionalFixed(num: number, decimalPlaces = 6) {
  // Convert to string to analyze decimal places
  const strNum = num.toString();

  // Check if it has a decimal point
  if (strNum.includes('.')) {
      const decimals = strNum.split('.')[1].length;

      // Only apply toFixed if it has more decimal places than specified
      if (decimals > decimalPlaces) {
          return num.toFixed(decimalPlaces);
      }
  }

  // Otherwise return the original number (as string to match toFixed behavior)
  return strNum;
}