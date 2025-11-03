"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.Plan = void 0;
// GraphQL Types
var Plan;
(function (Plan) {
    Plan["STARTER"] = "STARTER";
    Plan["PRO"] = "PRO";
    Plan["PARTNER"] = "PARTNER";
})(Plan || (exports.Plan = Plan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["TRIAL"] = "TRIAL";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=types.js.map