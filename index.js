import { BigNumber } from '@ethersproject/bignumber';

import {
    callContractFunction,
    convertWithDecimals,
    getLatestBlockNumber
} from "./utils.js";

import {
    YYPTP_ADDRESS,
    YYPTP_STAKING_ADDRESS,
    PTP_YYPTP_PAIR_ADDRESS,
    MASTER_PLATYPUSV3_ADDRESS,
    PERCENTAGE_REWARDS_TO_YYPTP,
    YYPTP_STAKING_ABI,
    MASTER_PLATYPUSV3_ABI,
    LP_TOKEN_ABI,
} from "./constants.js";

const getYyPTPAPR = async () => {
    //
    // Start by finding the latest blockNumber.
    //
    console.log("Getting latest blockNumber...");
    const latestBlock = await getLatestBlockNumber();
    console.log(`Latest block has been retrieved, number = ${BigNumber.from(latestBlock).toNumber()}, hexValue = ${latestBlock}`);
    //
    // Next we need the ptpPerSec emissions.
    //
    console.log("Getting the ptpPerSec for MasterPlatypusV3 contract...");
    let ptpPerSec = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'ptpPerSec', [], latestBlock);
    ptpPerSec = convertWithDecimals(BigNumber.from(ptpPerSec).toString(), 18);
    const ptpPerYear = ptpPerSec * 60 * 60 * 24 * 365;
    console.log(`ptpPerSec = ${ptpPerSec} PTP`);
    //
    // Then need the totalAdjustedAllocPoint for the MasterPlatypusV3 contract.
    // The reason we use the adjusted allocation points instead of totalBaseAllocPoint is that the adjusted values
    // take into account the adjustment required to be made to interest rates in order to balance coverage ratios, and
    // THESE are what the PTP rewards are given out on the basis of, not the baseAllocPoint.
    //
    console.log("Getting the totalAdjustedAllocPoint for MasterPlatypusV3 contract...");
    let totalAdjustedAllocPoint = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'totalAdjustedAllocPoint', [], latestBlock);
    totalAdjustedAllocPoint = convertWithDecimals(BigNumber.from(totalAdjustedAllocPoint).toString(), 18);
    console.log(`totalAdjustedAllocPoint = ${totalAdjustedAllocPoint}`);
    //
    // Now we need the poolLength so that we can call poolInfo and userInfo functions for all pools.
    //
    console.log("Getting the poolLength for MasterPlatypusV3 contract...");
    let poolLength = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'poolLength', [], latestBlock);
    poolLength = BigNumber.from(poolLength).toNumber();
    console.log(`poolLength = ${poolLength}`);
    //
    // Now we get the dialuting and non-dialuting repartitions, which represent the share of PTP emissions going to "base" rewards
    // and "boosted" rewards respectively, where base rewards are proportional to your deposits, and boosted rewards also depend
    // on your vePTP balance.
    //
    console.log("Getting the dialutingRepartition and nonDialutingRepartition for MasterPlatypusV3 contract...");
    let dialutingRepartition = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'dialutingRepartition', [], latestBlock);
    dialutingRepartition = BigNumber.from(dialutingRepartition).toNumber();
    let nonDialutingRepartition = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'nonDialutingRepartition', [], latestBlock);
    nonDialutingRepartition = BigNumber.from(nonDialutingRepartition).toNumber();
    console.log(`dialutingRepartition = ${dialutingRepartition}, nonDialutingRepartition = ${nonDialutingRepartition}`);
    //
    // Now we create an array of poolIDs, and query the poolInfo and userInfo data from the Master Platypus contract.
    // We use this information, and everything else gathered so far to calculate the PTP earned per year.
    //
    const poolIDs = [...Array(poolLength).keys()];
    console.log(`Getting the poolInfo and userInfo for MasterPlatypusV3 contract for our ${poolLength} pools...`);
    const poolUserInfo = await Promise.all(poolIDs.map(
        async (poolID) => {
            const poolInfo = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'poolInfo', [poolID], latestBlock);
            let { lpToken, adjustedAllocPoint, sumOfFactors } = poolInfo;
            adjustedAllocPoint = convertWithDecimals(BigNumber.from(adjustedAllocPoint).toString(), 18);
            // Platypus LP token is 6 decimals and vePTP is 18 => sqrt of the multiplied combo is 12 decimals.
            sumOfFactors = convertWithDecimals(BigNumber.from(sumOfFactors).toString(), 12);
            let totalLpSupply = await callContractFunction(LP_TOKEN_ABI, lpToken, 'balanceOf', [MASTER_PLATYPUSV3_ADDRESS], latestBlock);
            // Platypus LP tokens have 6 decimals.
            totalLpSupply = convertWithDecimals(BigNumber.from(totalLpSupply).toString(), 6);
            const userInfo = await callContractFunction(MASTER_PLATYPUSV3_ABI, MASTER_PLATYPUSV3_ADDRESS, 'userInfo', [poolID, YYPTP_ADDRESS], latestBlock);
            let { amount, factor } = userInfo;
            amount = convertWithDecimals(BigNumber.from(amount).toString(), 6);
            factor = convertWithDecimals(BigNumber.from(factor).toString(), 12);
            return (
                {
                    poolID,
                    basePTPEarnedPerYear: adjustedAllocPoint === 0 ? 0 : ptpPerYear * adjustedAllocPoint * (dialutingRepartition / 1000) * amount / (totalAdjustedAllocPoint * totalLpSupply),
                    boostedPTPEarnedPerYear: adjustedAllocPoint === 0 ? 0 : ptpPerYear * adjustedAllocPoint * (nonDialutingRepartition / 1000) * factor / (totalAdjustedAllocPoint * sumOfFactors),
                }
            )
        }
    ));
    const totalPTPEarnedPerYear = poolUserInfo.reduce((a, b) => a + b.basePTPEarnedPerYear + b.boostedPTPEarnedPerYear, 0);
    console.log(`Total PTP earned per year = ${totalPTPEarnedPerYear} PTP`);
    //
    // 10% of the PTP earned goes to yyPTP stakers.
    //
    const ptpEarnedForYyPtpStakersPerYear = PERCENTAGE_REWARDS_TO_YYPTP * totalPTPEarnedPerYear;
    console.log(`PTP rewards to yyPTP stakers per year = ${ptpEarnedForYyPtpStakersPerYear} PTP`);
    //
    // Need the amount of yyPTP that is staked.
    //
    console.log("Getting amount of yyPTP staked...");
    let yyPTPStaked = await callContractFunction(YYPTP_STAKING_ABI, YYPTP_STAKING_ADDRESS, 'internalBalance', [], latestBlock);
    yyPTPStaked = convertWithDecimals(BigNumber.from(yyPTPStaked).toString(), 18);
    console.log(`yyPTP staked = ${yyPTPStaked}`);
    //
    // We also need to current ratio of yyPTP to PTP, from the Pangolin pool, in order to calculate the relative worth of yyPTP to PTP (for the APR).
    //
    console.log("Getting reserve info for PTP-yyPTP...");
    const reserves = await callContractFunction(LP_TOKEN_ABI, PTP_YYPTP_PAIR_ADDRESS, 'getReserves', [], latestBlock);
    const { _reserve0, _reserve1 } = reserves;
    const reserve0 = convertWithDecimals(BigNumber.from(_reserve0).toString(), 18);
    const reserve1 = convertWithDecimals(BigNumber.from(_reserve1).toString(), 18);
    console.log(`PTP-yyPTP pair currently has ${Number(reserve0).toFixed(2)}... PTP and ${Number(reserve1).toFixed(2)}... yyPTP`);
    //
    // Here we get the ratio of PTP to yyPTP, giving it a maximum value of 1 as can always mint yyPTP at 1:1 ratio.
    //
    const yyPTPRatio = Math.min(1, Number(reserve0) / Number(reserve1));
    console.log(`PTP to yyPTP ratio = ${yyPTPRatio}`);
    const yyPTPStakedInPTP = yyPTPStaked * yyPTPRatio;
    //
    // And finally we can do our APR calculations.
    //
    const yyPTPAPR = ptpEarnedForYyPtpStakersPerYear / yyPTPStaked;
    const yyPTPAPRWithDiscount = ptpEarnedForYyPtpStakersPerYear / yyPTPStakedInPTP;
    console.log(`\nOverall yyPTP APR (assuming 1:1 ratio) = ${(100 * yyPTPAPR).toFixed(2)}% as of block ${BigNumber.from(latestBlock).toNumber()}`);
    console.log(`\nOverall yyPTP APR (using current PTP:yyPTP ratio) = ${(100 * yyPTPAPRWithDiscount).toFixed(2)}% as of block ${BigNumber.from(latestBlock).toNumber()}`);
};

getYyPTPAPR();