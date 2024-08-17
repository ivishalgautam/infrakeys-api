"use strict";
import controller from "./controller.js";

const schema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      image: { type: "string" },
    },
    required: ["name", "image"],
  },
};

export default async function routes(fastify, options) {
  fastify.post("/", { schema }, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/getById/:id", {}, controller.getById);
  fastify.get("/updateCategoryIds", {}, controller.updateCategoryIds);
}
