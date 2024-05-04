"use strict";
import table from "../../db/models.js";
import constants from "../../lib/constants/index.js";

const { NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR } = constants.http.status;

async function create(req, res) {
  try {
    const record = await table.PointsModel.getByUserId(req.body.user_id);
    if (record)
      return res
        .status(BAD_REQUEST)
        .send({ status: false, message: "Already exist!" });

    const data = await table.PointsModel.create(req);
    if (data) {
      req.body.channel_financing = "approved";
      await table.UserModel.update(req, req.body.user_id);
    }
    res.send({ status: true, message: "Created." });
  } catch (error) {
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function update(req, res) {
  try {
    const record = await table.PointsModel.getById(req);
    if (!record)
      return res
        .status(NOT_FOUND)
        .send({ status: false, message: "Not found!" });

    await table.PointsModel.update(req);
    res.send({ status: true, message: "Created." });
  } catch (error) {
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function get(req, res) {
  try {
    res.send({ status: true, data: await table.PointsModel.get(req) });
  } catch (error) {
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function getById(req, res) {
  try {
    const record = await table.PointsModel.getById(req);
    if (!record)
      return res
        .status(NOT_FOUND)
        .send({ status: false, message: "Not found!" });

    res.send({ status: true, data: record });
  } catch (error) {
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function deleteById(req, res) {
  try {
    const record = await table.PointsModel.deleteById(req);
    if (!record)
      return res
        .status(NOT_FOUND)
        .send({ status: false, message: "Not found!" });

    res.send({ status: true, message: "Deleted." });
  } catch (error) {
    console.log(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

export default {
  create: create,
  update: update,
  get: get,
  getById: getById,
  deleteById: deleteById,
};
