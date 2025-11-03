import { stripe } from "./stripe";
import {
  AppSyncContext,
  MutationResolvers,
  Plan,
  PlanSubscription,
  PlanSubscriptionCreateArgs,
} from "./types";
import Stripe from "stripe";

async function createStripeSubscription(
  ctx: AppSyncContext<PlanSubscriptionCreateArgs>
): Promise<PlanSubscription> {
  // create customer from user context
  const customer = await stripe.customers.create({
    name: ctx.identity.username,
  });

  let price: string;

  switch (ctx.arguments.plan) {
    case Plan.STARTER:
      price = "price_1Kvv6bKfsnO6FKLvWmtNLe6j";
      break;
    case Plan.PRO:
      price = "price_1KvbGMKfsnO6FKLva9EtEJn7";
      break;
    case Plan.PARTNER:
      price = "price_1KvbEIKfsnO6FKLvdzHnPXpj";
      break;
    default:
      throw new Error(`Invalid plan: ${ctx.arguments.plan}`);
  }

  // create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  // Type assertion for expanded fields
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

  return {
    id: subscription.id,
    clientSecret: paymentIntent.client_secret || undefined,
  };
}

const resolvers: MutationResolvers = {
  planSubscriptionCreate: async (
    ctx: AppSyncContext<PlanSubscriptionCreateArgs>
  ) => {
    return createStripeSubscription(ctx);
  },
};

export const handler = async (ctx: AppSyncContext): Promise<any> => {
  const typeHandler = resolvers[ctx.info.parentTypeName as keyof MutationResolvers];
  if (typeHandler) {
    const resolver = typeHandler as any;
    if (resolver) {
      return await resolver(ctx);
    }
  }
  throw new Error("Resolver not found.");
};
