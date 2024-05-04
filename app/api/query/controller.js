"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  let userData;
  try {
    userData = await table.UserModel.getByPhone(req);

    if (!userData) {
      userData = await table.UserModel.createCustomer(req);
    }

    await table.QueryModel.create(req, userData.id);
    res.send({ status: true, message: "Query sent." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.QueryModel.getById(req, req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Query not found!" });
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
    const queries = await table.QueryModel.get(req);
    res.send({ status: true, data: queries });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.QueryModel.getById(req, req.params.id);

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Query not found!" });

    await table.QueryModel.deleteById(req, req.params.id);
    res.send({ status: true, message: "Query deleted." });
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
  deleteById: deleteById,
  getById: getById,
};
