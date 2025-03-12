export const handler = async (event: any) => {
    console.log("Event received:", JSON.stringify(event));

    // to test failed event notification email
    // throw new Error("Simulated Consumer Lambda Failure");
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event processed successfully" }),
    };
  };
  