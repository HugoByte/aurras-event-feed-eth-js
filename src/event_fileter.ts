import { AppConfig, loadConfigFromEnv } from "./config_files";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();
export const config: AppConfig = loadConfigFromEnv();

const address = config.contract_address;
// const url ="wss://sepolia.infura.io/ws/v3/5596948b219c4f3e832aab7b358797b7"

export function checkProtocol(url: string): any {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol === "ws:" || parsedUrl.protocol === "wss:") {
    const provide = new ethers.providers.WebSocketProvider(url);
    return provide;
  } else if (
    parsedUrl.protocol === "http:" ||
    parsedUrl.protocol === "https:"
  ) {
    const provide = new ethers.providers.JsonRpcProvider(url);
    return provide;
  } else {
    return "Unknown";
  }
}

export async function waitEventEvm(eventName, contract, cb: (e: any) => void) {
  let height = await contract.provider.getBlockNumber();
  let next = height + 1;
  while (true) {
    if (height === next) {
      await sleep(1000);
      next = (await contract.provider.getBlockNumber()) + 1;
      continue;
    }
    for (; height < next; height++) {
      console.log(`waitEventEvmChain: ${height} -> ${next}`);
      const filteredEvents: any[] = [];
      for (let i = 0; i < eventName.length; i++) {
        const events = await contract.queryFilter(eventName[i], height);
        if (events.length > 0) {
          events.forEach(event =>{filteredEvents.push(event.args);})
        }
      }
      if (filteredEvents.length > 0) {
        cb(filteredEvents);
      }
    }
    console.log(height);
  }
}

function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
