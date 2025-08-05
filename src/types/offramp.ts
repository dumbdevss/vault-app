// Types for OffRamp functionality

export interface Currency {
  code: string;
  name: string;
  shortName: string;
  decimals: number;
  symbol: string;
  marketRate: string;
}

export interface Token {
  symbol: string;
  contractAddress: string;
  decimals: number;
  baseCurrency: string;
  network: string;
}

export interface Institution {
  name: string;
  code: string;
  type: string;
}

export interface RateResponse {
  status: string;
  message: string;
  data: number;
}

export interface AccountVerificationResponse {
  status: string;
  message: string;
  data: string; // Account holder name
}

export interface SwapDetails {
  tokenAmount: string;
  selectedToken: Token;
  selectedCurrency: Currency;
  fiatAmount: number;
  selectedInstitution: Institution;
  accountNumber: string;
  accountName: string;
  rate: number;
}
