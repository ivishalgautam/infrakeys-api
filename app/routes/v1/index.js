import jwtVerify from "../../helpers/auth.js";
import userRoutes from "../../api/users/routes.js";
import productRoutes from "../../api/products/routes.js";
import categoryRoutes from "../../api/categories/routes.js";
import subCategoryRoutes from "../../api/sub-categories/routes.js";
import subCategoryTypeRoutes from "../../api/sub-category-type/routes.js";
import brandRoutes from "../../api/brand/routes.js";
import bannerRoutes from "../../api/banner/routes.js";
import industriesRoutes from "../../api/industries/routes.js";
import orderRoutes from "../../api/order/routes.js";
import enquiryRoutes from "../../api/enquiry/routes.js";
import cartRoutes from "../../api/cart/routes.js";
import queryRoutes from "../../api/query/routes.js";
import pointsRoutes from "../../api/points/routes.js";
import dashboardRoutes from "../../api/dashboard/routes.js";

export default async function routes(fastify, options) {
  fastify.addHook("onRequest", jwtVerify.verifyToken);
  fastify.register(userRoutes, { prefix: "users" });
  fastify.register(productRoutes, { prefix: "products" });
  fastify.register(categoryRoutes, { prefix: "categories" });
  fastify.register(subCategoryRoutes, { prefix: "sub-categories" });
  fastify.register(subCategoryTypeRoutes, { prefix: "sub-category-types" });
  fastify.register(brandRoutes, { prefix: "brands" });
  fastify.register(bannerRoutes, { prefix: "banners" });
  fastify.register(industriesRoutes, { prefix: "industries" });
  fastify.register(orderRoutes, { prefix: "orders" });
  fastify.register(enquiryRoutes, { prefix: "enquiries" });
  fastify.register(cartRoutes, { prefix: "carts" });
  fastify.register(queryRoutes, { prefix: "queries" });
  fastify.register(pointsRoutes, { prefix: "points" });
  fastify.register(dashboardRoutes, { prefix: "dashboard" });
}
