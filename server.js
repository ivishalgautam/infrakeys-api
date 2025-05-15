import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import cors from "@fastify/cors";
import { dirname } from "path";
import path from "path";
import fastifyView from "@fastify/view";
import ejs from "ejs";

// import internal modules
import authRoutes from "./app/api/auth/routes.js";
import pg_database from "./app/db/postgres.js";
import routes from "./app/routes/v1/index.js";
import uploadFileRoutes from "./app/api/upload_files/routes.js";
import productController from "./app/api/products/controller.js";
import categoriesController from "./app/api/categories/controller.js";
import subCategoriesController from "./app/api/sub-categories/controller.js";
import industriesController from "./app/api/industries/controller.js";
import brandsController from "./app/api/brand/controller.js";
import bannerController from "./app/api/banner/controller.js";
import queryController from "./app/api/query/controller.js";
import userController from "./app/api/users/controller.js";
import blogController from "./app/api/blog/controller.js";
import newsController from "./app/api/news/controller.js";
import newsCategoriesController from "./app/api/news-category/controller.js";
import { querySchema } from "./app/api/query/routes.js";
/*
  Register External packages, routes, database connection
*/

export default (app) => {
  app.register(fastifyStatic, {
    root: path.join(dirname(fileURLToPath(import.meta.url), "public")),
  });

  app.register(cors, { origin: "*" });
  app.register(pg_database);
  // Increase the payload size limit
  app.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // Set the limit to 5 GB or adjust as needed
  });

  app.register(routes, { prefix: "v1" });
  app.register(authRoutes, { prefix: "v1/auth" });
  app.register(uploadFileRoutes, { prefix: "v1/upload" });

  app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
  });

  // user
  app.post("/v1/users", {}, userController.create);

  // products
  app.get("/v1/products", {}, productController.get);
  app.get("/v1/products/:slug", {}, productController.getBySlug);
  app.get(
    "/v1/products/getByCategory/:slug",
    {},
    productController.getByCategory
  );
  app.get(
    "/v1/products/getBySubCategory/:slug",
    {},
    productController.getBySubCategory
  );
  app.get("/v1/products/search", {}, productController.searchProducts);

  // categories
  app.get("/v1/categories", {}, categoriesController.get);
  app.get("/v1/categories/:slug", {}, categoriesController.getBySlug);
  app.get(
    "/v1/categories/getVariantsBySlug/:slug",
    {},
    categoriesController.getVariantsBySlug
  );

  // sub-categories
  app.get("/v1/sub-categories", {}, subCategoriesController.get);
  app.get(
    "/v1/sub-categories/getByCategory/:slug",
    {},
    subCategoriesController.getByCategory
  );
  app.get("/v1/sub-categories/:slug", {}, subCategoriesController.getBySlug);

  // industries
  app.get("/v1/industries", {}, industriesController.get);

  // brand
  app.get("/v1/brands", {}, brandsController.get);

  // banner
  app.get("/v1/banners", {}, bannerController.get);

  // query
  app.post("/v1/queries", querySchema, queryController.create);

  // blogs
  app.get("/v1/blogs", {}, blogController.get);
  app.get("/v1/blogs/getBySlug/:slug", {}, blogController.getBySlug);
  app.get("/v1/blogs/getRelatedBlogs/:id", {}, blogController.getRelatedBlogs);

  // news
  app.get("/v1/news", {}, newsController.get);
  app.get("/v1/news/getBySlug/:slug(*)", {}, newsController.getBySlug);
  app.get(
    "/v1/news/getByCategorySlug/:slug",
    {},
    newsController.getByCategorySlug
  );
  app.get("/v1/news/getRelatedNews/:id", {}, newsController.getRelatedNews);

  // news categories
  app.get("/v1/news-categories", {}, newsCategoriesController.get);

  // enquiry
  // app.post("/v1/enquiries", {}, enquiryController.create);
};
