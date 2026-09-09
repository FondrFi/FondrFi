import { ROBINHOOD_CHAIN } from "./robinhood-chain"

export type StakingMethodSelectors = {
  stakedBalance: string | null
  pendingRewards: string | null
  stake: string | null
  unstake: string | null
  claim: string | null
}

export type FondrFiStakingConfig = {
  chainId: number
  token: {
    address: string | null
    symbol: string
    name: string
    decimals: number
  }
  staking: {
    address: string | null
  }
  selectors: StakingMethodSelectors
}

/**
 * The deployment intentionally stays empty until the official FONDRFI token
 * and staking contract are launched. The selectors belong here too because
 * the staking ABI and reward mechanics have not been finalized yet.
 */
export const FONDRFI_STAKING_CONFIG: FondrFiStakingConfig = {
  chainId: ROBINHOOD_CHAIN.id,
  token: {
    address: null,
    symbol: "FONDRFI",
    name: "FondrFi",
    decimals: 18,
  },
  staking: {
    address: null,
  },
  selectors: {
    stakedBalance: null,
    pendingRewards: null,
    stake: null,
    unstake: null,
    claim: null,
  },
}

export function isContractAddress(value: string | null): value is string {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value) && !/^0x0{40}$/i.test(value))
}

function isSelector(value: string | null) {
  return Boolean(value && /^0x[a-fA-F0-9]{8}$/.test(value))
}

export function isStakingConfigured(config: FondrFiStakingConfig = FONDRFI_STAKING_CONFIG) {
  return config.chainId === ROBINHOOD_CHAIN.id
    && isContractAddress(config.token.address)
    && isContractAddress(config.staking.address)
    && Object.values(config.selectors).every(isSelector)
}

export function encodeAddress(address: string) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0")
}

export function encodeUint256(value: bigint) {
  return value.toString(16).padStart(64, "0")
}

export function encodeCall(selector: string, ...encodedArguments: string[]) {
  return `${selector}${encodedArguments.join("")}`
}

export function decodeUint256(value: string) {
  if (!/^0x[a-fA-F0-9]*$/.test(value) || value.length < 3) {
    throw new Error("The staking contract returned an invalid value.")
  }
  return BigInt(value)
}