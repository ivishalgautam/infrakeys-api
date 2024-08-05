"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";
import fileController from "../upload_files/controller.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  try {
    let slug = slugify(req.body.name, { lower: true });
    req.body.slug = slug;
    const record = await table.SubCategoryModel.getBySlug(req, slug);

    if (record)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Sub category exist with this name!" });

    const product = await table.SubCategoryModel.create(req);
    res.send({ status: true, data: product });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const updateById = async (req, res) => {
  try {
    let slug = slugify(req.body.name, { lower: true });
    req.body.slug = slug;

    const record = await table.SubCategoryModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Sub category not found!" });
    }

    const slugExist = await table.SubCategoryModel.getBySlug(
      req,
      req.body.slug
    );

    // Check if there's another Product with the same slug but a different ID
    if (slugExist && record?.id !== slugExist?.id)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Sub category exist with this name!" });

    res.send({
      status: true,
      data: await table.SubCategoryModel.update(req, req.params.id),
    });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getBySlug = async (req, res) => {
  try {
    const record = await table.SubCategoryModel.getBySlug(req);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Sub category not found!" });
    }

    res.send({
      status: true,
      data: await table.SubCategoryModel.getBySlug(req),
    });
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

    res.send({
      status: true,
      data: await table.SubCategoryModel.getByCategory(req, req.params.slug),
    });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.SubCategoryModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Sub category not found!" });
    }

    res.send({ status: true, data: record });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const updateCategoryIds = async (req, res) => {
  try {
    const data = await table.SubCategoryModel.updateCategoryIds();

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
    const products = await table.SubCategoryModel.get(req);
    res.send({ status: true, data: products });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.SubCategoryModel.getById(req, req.params.id);

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Sub category not found!" });

    await table.SubCategoryModel.deleteById(req, req.params.id);
    req.query.file_path = record?.image;
    fileController.deleteFile(req, res);

    res.send({ status: true, message: "Sub category deleted." });
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
  getByCategory: getByCategory,
  getById: getById,
  updateCategoryIds: updateCategoryIds,
};
