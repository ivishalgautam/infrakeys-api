"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  try {
    const productId = req.body?.product_id;
    const percentage = req.body?.percentage ?? 0;
    let mainProduct = null;

    let slug = slugify(`${req.body.title}-${req.body.place}`, { lower: true });
    req.body.slug = slug;

    const record = await table.ProductPricingModel.getBySlug(req, slug);
    if (record)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Product exist with this name!" });

    if (productId) {
      mainProduct = await table.ProductPricingModel.getById(0, productId);
    }
    if (productId && !mainProduct) {
      return res
        .code(404)
        .send({ status: false, message: "Main product not found!" });
    }
    if (mainProduct) {
      const percentageValue = (percentage / mainProduct.price) * 100;
      req.body.price = mainProduct.price + percentageValue;
    }
    console.log(req.body);
    const product = await table.ProductPricingModel.create(req);

    res.send({ status: true, data: product });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message });
  }
};

const updateById = async (req, res) => {
  try {
    const price = req.body.price;
    const percentage = req.body.percentage;
    let slug = slugify(`${req.body.title}-${req.body.place}`, { lower: true });
    req.body.slug = slug;

    const record = await table.ProductPricingModel.getById(req, req.params.id);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Product not found!" });
    }

    const slugExist = await table.ProductPricingModel.getBySlug(
      req,
      req.body.slug
    );

    // Check if there's another product with the same slug but a different ID
    if (slugExist && record?.id !== slugExist?.id)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Product exist with this title!" });

    if (record.is_variant && percentage != record.percentage) {
      const mainProduct = await table.ProductPricingModel.getById(
        0,
        record.product_id
      );
      const percentageValue = (percentage / 100) * mainProduct.price;
      console.log({ percentageValue });
      await table.ProductPricingModel.updateById({
        params: { id: req.params.id },
        body: {
          ...req.body,
          price: Number(mainProduct.price) + percentageValue,
        },
      });
    } else {
      await table.ProductPricingModel.updateById(req);
    }

    if (!record.is_variant && price != record.price) {
      const childProducts = await table.ProductPricingModel.getByMain(
        record.id
      );

      const promises = childProducts.map(async (prd) => {
        const percentageValue = (prd.percentage / 100) * price;
        await table.ProductPricingModel.updateById(
          { body: { price: Number(price) + percentageValue } },
          prd.id
        );
      });

      await Promise.all(promises);
    }

    res.send({ status: true, message: "Product updated." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getBySlug = async (req, res) => {
  try {
    const record = await table.ProductPricingModel.getBySlug(
      req,
      req.params.slug
    );

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Product not found!" });
    }

    res.send({
      status: true,
      data: {
        ...record,
        categories: [
          ...new Map(
            record?.categories.map((item) => [item.id, item])
          ).values(),
        ],
      },
    });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getBySubCategory = async (req, res) => {
  try {
    const record = await table.SubCategoryModel.getBySlug(req, req.params.slug);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });
    }

    const { products, total_page, page } =
      await table.ProductPricingModel.getBySubCategory(req, req.params.slug);

    res.send({ status: true, page, total_page, data: products });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getByCategory = async (req, res) => {
  try {
    const record = await table.CategoryModel.getBySlug(req, req.params.slug);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });
    }

    const { products, total_page, page } =
      await table.ProductPricingModel.getByCategory(req, req.params.slug);

    res.send({ status: true, page, total_page, data: products });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.ProductPricingModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Product not found!" });
    }

    const data = {
      ...record,
      variants:
        record.variants?.filter(
          (so) => !Object.values(so).every((d) => d === null)
        ) ?? [],
    };
    res.send({ status: true, data: data });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    const data = await table.ProductPricingModel.get(req);
    res.send({ status: true, data });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.ProductPricingModel.getById(req, req.params.id);

    if (!record)
      return res.code(NOT_FOUND).send({ message: "Product not found!" });

    await table.ProductPricingModel.deleteById(req, req.params.id);
    res.send({ status: true, message: "Product deleted." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const searchProducts = async (req, res) => {
  try {
    const data = await table.ProductPricingModel.searchProducts(req);
    res.send({ status: true, data });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getBySlug: getBySlug,
  getById: getById,
  getByCategory: getByCategory,
  getBySubCategory: getBySubCategory,
  searchProducts: searchProducts,
};
