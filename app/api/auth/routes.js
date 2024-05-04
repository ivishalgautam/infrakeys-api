"use strict";
import controller from "./controller.js";

const schema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      image: { type: "string" },
    },
    required: ["name"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/login", {}, controller.verifyUserCredentials);
  fastify.post("/signup", {}, controller.createNewUser);
  fastify.post("/login/customer", {}, controller.verifyCustomer);
  fastify.post("/signup/customer", {}, controller.createNewCustomer);
  fastify.post("/refresh", {}, controller.verifyRefreshToken);

  //otp
  fastify.post("/send", {}, controller.createOtp);
  fastify.post("/verify", {}, controller.verifyOtp);
}
