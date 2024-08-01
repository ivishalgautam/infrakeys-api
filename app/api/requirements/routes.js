"use strict";
import controller from "./controller.js";
const create = {
  body: {
    type: "object",
    properties: {
      docs: { type: "string" },
    },
    required: ["docs"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/", create, controller.create);
  fastify.get("/:id", {}, controller.getById);
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", {}, controller.deleteById);
}
