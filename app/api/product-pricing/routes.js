"use strict";
import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.post("/", {}, controller.create);
  fastify.put("/:id", {}, controller.updateById);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/getById/:id", {}, controller.getById);
}
