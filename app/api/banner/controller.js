"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import fileController from "../upload_files/controller.js";

const create = async (req, res) => {
  try {
    const product = await table.BannerModel.create(req);
    res.send(product);
  } catch (error) {
    console.error(error);
    res
      .code(constants.http.status.INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const updateById = async (req, res) => {
  try {
    const record = await table.BannerModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(constants.http.status.NOT_FOUND)
        .send({ message: "Banner not found!" });
    }

    res.send(await table.BannerModel.update(req, req.params.id));
  } catch (error) {
    console.error(error);
    res
      .code(constants.http.status.INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.BannerModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(constants.http.status.NOT_FOUND)
        .send({ message: "Banner not found!" });
    }

    res.send(record);
  } catch (error) {
    console.error(error);
    res
      .code(constants.http.status.INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    const data = await table.BannerModel.get(req);

    res.send({ status: true, data });
  } catch (error) {
    console.error(error);
    res
      .code(constants.http.status.INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.BannerModel.getById(req, req.params.id);

    if (!record)
      return res
        .code(constants.http.status.NOT_FOUND)
        .send({ message: "Banner not found!" });

    await table.BannerModel.deleteById(req, req.params.id);
    if (record?.image) {
      req.query.file_path = record?.image;
      fileController.deleteFile(req, res);
    }
    res.send({ mesage: "Banner deleted." });
  } catch (error) {
    console.error(error);
    res
      .code(constants.http.status.INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getById: getById,
};
