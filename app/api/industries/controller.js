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
    const record = await table.IndustriesModel.getBySlug(req, slug);

    if (record)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Category exist with this name!" });

    const product = await table.IndustriesModel.create(req);
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

    const record = await table.IndustriesModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });
    }

    const slugExist = await table.IndustriesModel.getBySlug(req, req.body.slug);

    // Check if there's another Product with the same slug but a different ID
    if (slugExist && record?.id !== slugExist?.id)
      return res
        .code(BAD_REQUEST)
        .send({ message: "Category exist with this name!" });

    res.send({
      status: true,
      data: await table.IndustriesModel.update(req, req.params.id),
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
    let slug = slugify(req.body.title, { lower: true });
    req.body.slug = slug;

    const record = await table.IndustriesModel.getBySlug(req, req.params.slug);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });
    }

    res.send({
      status: true,
      data: await table.IndustriesModel.getById(req, req.params.id),
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
    const record = await table.IndustriesModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });
    }

    res.send({ status: true, data: record });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    const industries = await table.IndustriesModel.get(req);
    res.send({ status: true, data: industries });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.IndustriesModel.getById(req, req.params.id);

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Category not found!" });

    await table.IndustriesModel.deleteById(req, req.params.id);
    req.query.file_path = record?.image;
    fileController.deleteFile(req, res);

    res.send({ status: true, message: "Category deleted." });
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
};
