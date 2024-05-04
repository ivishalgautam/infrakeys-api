"use strict";
import controller from "./controller.js";
const create = {
  body: {
    type: "object",
    properties: {
      user_id: { type: "string" },
      points: { type: "string" },
    },
    required: ["user_id", "points"],
  },
};
const update = {
  body: {
    type: "object",
    properties: {
      points: { type: "string" },
    },
    required: ["points"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/", create, controller.create);
  fastify.put("/:id", update, controller.update);
  fastify.get("/:id", {}, controller.getById);
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", {}, controller.deleteById);
}
