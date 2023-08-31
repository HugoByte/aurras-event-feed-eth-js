import * as openwhisk from "openwhisk";
import * as dotenv from "dotenv";

import { AppConfig, loadConfigFromEnv } from "./config_files";
import { checkProtocol, waitEventEvm } from "./event_fileter";
import { ethers } from "ethers";

dotenv.config();
export const config: AppConfig = loadConfigFromEnv();

const OpenwhiskClinet = openwhisk({
  apihost: config.openwhisk_host,
  api_key: config.openwhisk_api_key,
  namespace: config.openwhisk_namespace,
  ignore_certs: true,
});

const provide = checkProtocol(config.endpoint);
const abi =require(config.abi_path);
const contractObject = new ethers.Contract(config.contract_address, abi, provide);
const eventName = config.event_names;

waitEventEvm(eventName,contractObject, (events) => {
  events.forEach((event) => {
    OpenwhiskClinet.actions
      .invoke({
        name: config.event_reciever,
        params: {
          brokers: config.kafka_brokers,
          event: event,
          topic: config.topic,
          eventProcessor: config.event_processor,
        },
      })
      .then((activation) => console.log(activation));
  });
}).catch((error) => console.log(error));
