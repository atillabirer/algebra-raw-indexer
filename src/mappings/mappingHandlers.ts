import { Approval, Transaction, createAlgebraPoolDatasource } from "../types";
import {
  FrontierEvmEvent,
  FrontierEvmCall,
} from "@subql/frontier-evm-processor";
import { BigNumber } from "ethers";
import assert from "assert";
import { Pool, Position } from "../types/models";


// Setup types from ABI
type TransferEventArgs = [string, string, BigNumber] & {
  from: string;
  to: string;
  value: BigNumber;
};
type ApproveCallArgs = [string, BigNumber] & {
  _spender: string;
  _value: BigNumber;
};

function getPositionKey(ownerHex: string, bottomTick: number, topTick: number): string {
  // Convert hex string to BigInt
  const owner = BigInt(ownerHex);

  // Handle negative values correctly
  const bottomTickBigInt = BigInt.asUintN(64, BigInt(bottomTick));
  const topTickBigInt = BigInt.asUintN(64, BigInt(topTick));

  // Perform the bit manipulations
  const shiftedOwner = owner << BigInt(24);
  const maskedBottomTick = bottomTickBigInt & BigInt(0xFFFFFF);
  const maskedTopTick = topTickBigInt & BigInt(0xFFFFFF);

  // Combine the values
  const combined = ((shiftedOwner | maskedBottomTick) << BigInt(24)) | maskedTopTick;

  return '0x' + combined.toString(16).padStart(64, '0');
}

export async function handleMint(
  event:FrontierEvmEvent
): Promise<void> {

  const owner = event.args?.[1];
  const topTick = event.args?.[2];
  const bottomTick = event.args?.[3];
  const liquidityAmount = event.args?.[4].toString();
  const token0 = event.args?.[5].toString();
  const token1 = event.args?.[6].toString();
  logger.info(`event.address ${event.address}`)
  logger.info(`token0: ${token0}`);
  logger.info(`token1: ${token1}`);
  //event.address == pool address
  const pos = new Position(getPositionKey(owner,bottomTick,topTick),owner,topTick,bottomTick,event.address.toLowerCase(),liquidityAmount,token0,token1);
  
  pos.poolAddressId = event.address.toLowerCase();

  
  await pos.save();
}

export async function handleBurn(
  event:FrontierEvmEvent
): Promise<void> {

  const owner = event.args?.[0];
  const topTick = event.args?.[2];
  const bottomTick = event.args?.[3];
 const pos = await Position.remove(getPositionKey(owner,topTick,bottomTick));
 logger.info(`eventAddress:${event.address}`);
  
}

export async function handlePool(event: FrontierEvmEvent) {

  createAlgebraPoolDatasource({address: event.args?.[2]})
  //create pool with tokens
  const pool = new Pool(event.args?.[2].toLowerCase());
  pool.save();
  logger.info(`Pool added: ${event.args?.[2]}`);
}


export async function handleFrontierEvmCall(
  event: FrontierEvmCall<ApproveCallArgs>
): Promise<void> {
  assert(event.args, "No event.args");
  assert(event.to, "No event.to");

  const approval = Approval.create({
    id: event.hash,
    owner: event.from,
    value: event.args._value.toBigInt(),
    spender: event.args._spender,
    contractAddress: event.to,
  });
  await approval.save();
}
