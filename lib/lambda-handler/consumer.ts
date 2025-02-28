export const handler = async (event: any) => {
    console.log("Event received:", JSON.stringify(event));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event processed successfully" }),
    };
  };
  