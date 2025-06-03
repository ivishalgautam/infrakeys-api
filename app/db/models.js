"use strict";
import userModel from "./models/user.model.js";
import productModel from "./models/product.model.js";
import categoryModel from "./models/category.model.js";
import brandModel from "./models/brand.model.js";
import orderModel from "./models/order.model.js";
import orderItemModel from "./models/order-item.model.js";
import enquiryModel from "./models/enquiry.model.js";
import enquiryItemModel from "./models/enquiry-item.model.js";
import cartModel from "./models/cart.model.js";
import queryModel from "./models/query.model.js";
import otpModel from "./models/otp.model.js";
import bannerModel from "./models/banner.model.js";
import subCategoryModel from "./models/sub-category.model.js";
import industriesModel from "./models/industries.model.js";
import subCatTypeModel from "./models/sub_category_type.model.js";
import pointsModel from "./models/points.model.js";
import blogModel from "./models/blog.model.js";
import applyCreditModel from "./models/apply-credit.model.js";
import requirementsModel from "./models/requirements.model.js";
import requirementSequenceModel from "./models/requirement-sequence.model.js";
import newsModel from "./models/news.model.js";
import newsCategoryModel from "./models/news-category.model.js";
import productPricingModel from "./models/product-pricing.model.js";

export default {
  UserModel: userModel,
  ProductModel: productModel,
  ProductPricingModel: productPricingModel,
  CategoryModel: categoryModel,
  // SubCategoryModel: subCategoryModel,
  SubCatTypeModel: subCatTypeModel,
  BrandModel: brandModel,
  IndustriesModel: industriesModel,
  OrderModel: orderModel,
  OrderItemModel: orderItemModel,
  EnquiryModel: enquiryModel,
  EnquiryItemModel: enquiryItemModel,
  CartModel: cartModel,
  QueryModel: queryModel,
  OtpModel: otpModel,
  BannerModel: bannerModel,
  PointsModel: pointsModel,
  BlogModel: blogModel,
  ApplyCreditModel: applyCreditModel,
  RequirementsModel: requirementsModel,
  RequirementSequenceModel: requirementSequenceModel,
  NewsCategoryModel: newsCategoryModel,
  NewsModel: newsModel,
};
