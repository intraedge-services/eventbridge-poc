import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as eventschemas  from 'aws-cdk-lib/aws-eventschemas';
import { Construct } from 'constructs';

export class EventbridgePocStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Schema Registry
    const schemaRegistry = new eventschemas.CfnRegistry(this, "SchemaRegistry", {
      registryName: "my-schema-registry",
      description: "Registry for EventBridge event schemas",
    });

    // Define a Schema inside the Registry
    const schema = new eventschemas.CfnSchema(this, "MyEventSchema", {
      registryName: schemaRegistry.registryName!,
      schemaName: "MyEventSchema",
      type: "OpenApi3",
      content: JSON.stringify({
        openapi: "3.0.0",
        info: { title: "MyEventSchema", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            MyEventDetail: {
              type: "object",
              properties: {
                userId: { type: "string" },
                action: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
              },
              required: ["userId", "action", "timestamp"],
            },
          },
        },
      }),
    });

     // Create a central integration event bus
     const centralIntegrationEventBus = new events.EventBus(
      this,
      'CentralIntegrationEventBus',
      {
        eventBusName: 'central-integration-event-bus'
      }
    );    


    //  Publisher Lambda (Sends Events to EventBridge)
    const publisherLambda = new NodejsFunction(this, "PublisherLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: "lib/lambda-handler/publisher.ts",
      handler: "handler",
      environment: {
        EVENT_BUS_NAME: centralIntegrationEventBus.eventBusName,
        AWS_REGION: 'us-east-2'
      },
    });


    // Create API Gateway to trigger publisherLambda
    const api = new apigateway.RestApi(this, "EventPublisherApi", {
      restApiName: "Event Publisher Service",
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(publisherLambda);
    api.root.addResource("publish").addMethod("POST", lambdaIntegration);

    // Grant permissions for Lambda to put events in EventBridge
    centralIntegrationEventBus.grantPutEventsTo(publisherLambda);


    //  Consumer Lambda (Listens for Events from EventBridge)
    const consumerLambda = new NodejsFunction(this, "ConsumerLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: "lib/lambda-handler/consumer.ts",
      handler: "handler",
      environment: {
        EVENT_BUS_NAME: centralIntegrationEventBus.eventBusName,
      },
    });

    //  EventBridge Rule to Trigger Consumer Lambda
    new events.Rule(this, "EventRule", {
      eventBus: centralIntegrationEventBus,
      eventPattern: {
        source: ["custom.app"],  
        detailType: ["UserAction"],
      },
      targets: [new targets.LambdaFunction(consumerLambda)],
    
    });


  }
}
