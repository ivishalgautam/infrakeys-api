"use strict";
import controller from "./controller.js";

export const querySchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      pincode: { type: "string" },
      company: { type: "string" },
      company_gst: { type: "string" },
      message: { type: "string" },
    },
    required: [
      "name",
      "email",
      "phone",
      "pincode",
      "company_gst",
      "comapny",
      "message",
    ],
  },
};

export default async function routes(fastify, options) {
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/:id", {}, controller.getById);
  fastify.get("/", {}, controller.get);
}
