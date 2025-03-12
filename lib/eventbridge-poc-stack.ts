import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as eventschemas  from 'aws-cdk-lib/aws-eventschemas';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import  MyEventSchema  from './schemas/my-event.json'

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
            MyEventDetail: MyEventSchema,
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
        EVENT_BUS_NAME: centralIntegrationEventBus.eventBusName
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

    // CloudWatch Metric Filter for Failed Events
    new logs.MetricFilter(this, "ConsumerLambdaFailureMetricFilter", {
      logGroup: consumerLambda.logGroup,
      metricNamespace: "LambdaErrors",
      metricName: "ConsumerLambdaErrors",
      filterPattern: logs.FilterPattern.anyTerm("ERROR", "Error", "error"),
      metricValue: "1",
    });

     // SNS Topic for Failure Alerts
     const snsTopic = new sns.Topic(this, "EventBridgeFailureAlerts", {
      displayName: "EventBridge Failure Alerts",
    });

    // Subscribe an email to the SNS Topic
    snsTopic.addSubscription(new subs.EmailSubscription("sumittest@yopmail.com"));

    // CloudWatch Alarm for EventBridge Failures
    const lambdaFailureAlarm = new cloudwatch.Alarm(this, "EventBridgeFailureAlarm", {
      metric: consumerLambda.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1
    });
    

    // Add SNS notification to the alarm
    lambdaFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

  }
}
