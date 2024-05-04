"use strict";
import controller from "./controller.js";

const schema = {
  body: {
    type: "object",
    properties: {
      image: { type: "string" },
      category_id: { type: "category_id" },
    },
    required: ["image", "category_id"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/", schema, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/:id", {}, controller.getById);
}
