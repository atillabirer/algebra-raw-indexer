import { Approval, Transaction } from "../types";
import {
  FrontierEvmEvent,
  FrontierEvmCall,
} from "@subql/frontier-evm-processor";
import { BigNumber } from "ethers";
import assert from "assert";
import { Position } from "../types/models";

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
  const pos = new Position(getPositionKey(owner,bottomTick,topTick),topTick,bottomTick);
  
  await pos.save();
}

export async function handleBurn(
  event:FrontierEvmEvent
): Promise<void> {

  const owner = event.args?.[0];
  const topTick = event.args?.[2];
  const bottomTick = event.args?.[3];
 const pos = await Position.remove(getPositionKey(owner,topTick,bottomTick));
  
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
