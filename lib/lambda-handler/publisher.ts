import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event));
  const eventBusName = process.env.EVENT_BUS_NAME || "default";

  const eventDetail = {
    Source: "custom.app",
    DetailType: "UserAction",
    Detail: JSON.stringify(event),
    EventBusName: eventBusName,
  };

  try {
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
