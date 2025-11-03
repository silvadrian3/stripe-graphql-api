"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const stripe_1 = require("./stripe");
const types_1 = require("./types");
async function createStripeSubscription(ctx) {
    // create customer from user context
    const customer = await stripe_1.stripe.customers.create({
        name: ctx.identity.username,
    });
    let price;
    switch (ctx.arguments.plan) {
        case types_1.Plan.STARTER:
            price = "price_1Kvv6bKfsnO6FKLvWmtNLe6j";
            break;
        case types_1.Plan.PRO:
            price = "price_1KvbGMKfsnO6FKLva9EtEJn7";
            break;
        case types_1.Plan.PARTNER:
            price = "price_1KvbEIKfsnO6FKLvdzHnPXpj";
            break;
        default:
            throw new Error(`Invalid plan: ${ctx.arguments.plan}`);
    }
    // create the subscription
    const subscription = await stripe_1.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
    });
    // Type assertion for expanded fields
    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = latestInvoice.payment_intent;
    return {
        id: subscription.id,
        clientSecret: paymentIntent.client_secret || undefined,
    };
}
const resolvers = {
    planSubscriptionCreate: async (ctx) => {
        return createStripeSubscription(ctx);
    },
};
const handler = async (ctx) => {
    const typeHandler = resolvers[ctx.info.parentTypeName];
    if (typeHandler) {
        const resolver = typeHandler;
        if (resolver) {
            return await resolver(ctx);
        }
    }
    throw new Error("Resolver not found.");
};
exports.handler = handler;
//# sourceMappingURL=mutation.js.map