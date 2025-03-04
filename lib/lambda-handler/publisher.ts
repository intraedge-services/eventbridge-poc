import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import Ajv from "ajv";
import addFormats from 'ajv-formats'
import  MyEventSchema  from '../schemas/my-event.json'

const client = new EventBridgeClient({ region: process.env.AWS_REGION });
const ajv = new Ajv()
addFormats(ajv)
const MyEventvalidate = ajv.compile(MyEventSchema);

export const handler = async (event: any) => {
  try {

    console.log("Received event:", JSON.stringify(event));
    const eventBusName = process.env.EVENT_BUS_NAME || "default";
    const eventBody = event.body;
  
    const eventDetail = {
      Source: "custom.app",
      DetailType: "UserAction",
      Detail: eventBody,
      EventBusName: eventBusName,
    };


    if (!MyEventvalidate(JSON.parse(eventBody))) {
      console.error("Invalid Event:", MyEventvalidate.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid Event Schema", errors: MyEventvalidate.errors }),
      };
    }


    const response = await client.send(
      new PutEventsCommand({
        Entries: [eventDetail],
      })
    );

    console.log("Event Published:", response);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event published successfully", response }),
    };
  } catch (error) {
    console.error("Error publishing event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to publish event", error }),
    };
  }
};
