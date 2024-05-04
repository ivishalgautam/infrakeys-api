"use strict";
import controller from "./controller.js";

const schema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      image: { type: "string" },
      category_id: { type: "string" },
    },
    required: ["name", "image", "category_id"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/", { schema }, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/getById/:id", {}, controller.getById);
}
