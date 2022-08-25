export const ANKR_RPC_URL = 'https://rpc.ankr.com/avalanche';

export const YYPTP_ADDRESS = "0x40089e90156fc6f994cc0ec86dbe84634a1c156f";
export const YYPTP_STAKING_ADDRESS = "0x9bc36cc686800be1905bf7e10578ee6fbdd6f27a";

export const PTP_YYPTP_PAIR_ADDRESS = "0x7a8ae10536d6920aa609d12775ffe6d73376668f";

export const MASTER_PLATYPUSV3_ADDRESS = "0x68c5f4374228beedfa078e77b5ed93c28a2f713e";

export const PERCENTAGE_REWARDS_TO_YYPTP = 0.15;

export const LP_TOKEN_ABI = [
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getReserves", "outputs": [{ "internalType": "uint112", "name": "_reserve0", "type": "uint112" }, { "internalType": "uint112", "name": "_reserve1", "type": "uint112" }, { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }], "stateMutability": "view", "type": "function" },
];

export const YYPTP_STAKING_ABI = [
    { "inputs": [], "name": "internalBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export const MASTER_PLATYPUSV3_ABI = [
    { "inputs": [], "name": "ptpPerSec", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalAdjustedAllocPoint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "poolLength", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "dialutingRepartition", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "nonDialutingRepartition", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "poolInfo", "outputs": [{ "internalType": "contract IAsset", "name": "lpToken", "type": "address" }, { "internalType": "uint256", "name": "baseAllocPoint", "type": "uint256" }, { "internalType": "uint256", "name": "lastRewardTimestamp", "type": "uint256" }, { "internalType": "uint256", "name": "accPtpPerShare", "type": "uint256" }, { "internalType": "contract IRewarder", "name": "rewarder", "type": "address" }, { "internalType": "uint256", "name": "sumOfFactors", "type": "uint256" }, { "internalType": "uint256", "name": "accPtpPerFactorShare", "type": "uint256" }, { "internalType": "uint256", "name": "adjustedAllocPoint", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }], "name": "userInfo", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "rewardDebt", "type": "uint256" }, { "internalType": "uint256", "name": "factor", "type": "uint256" }], "stateMutability": "view", "type": "function" },
];