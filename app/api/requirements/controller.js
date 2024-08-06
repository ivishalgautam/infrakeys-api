"use strict";
import table from "../../db/models.js";
import { deleteFile } from "../../helpers/file.js";
import constants from "../../lib/constants/index.js";

const { NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR } = constants.http.status;

async function create(req, res) {
  try {
    const prefix = "REQ00000";
    const requirementSequence = await table.RequirementSequenceModel.findOne();
    const nextValue = requirementSequence.value + 1;
    req.body.requirement_id = `${prefix}${nextValue}`;
    console.log({ requirementSequence, nextValue });
    const data = await table.RequirementsModel.create(req);
    if (data) {
      await table.RequirementSequenceModel.update({ value: nextValue });
    }
    res.send({ status: true, message: "Documents uploaded." });
  } catch (error) {
    console.log(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function get(req, res) {
  try {
    res.send({ status: true, data: await table.RequirementsModel.get(req) });
  } catch (error) {
    console.log(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function getById(req, res) {
  try {
    const record = await table.RequirementsModel.getById(req);
    if (!record)
      return res.code(NOT_FOUND).send({ status: false, message: "Not found!" });

    res.send({ status: true, data: record });
  } catch (error) {
    console.log(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

async function deleteById(req, res) {
  try {
    const record = await table.RequirementsModel.getById(req);
    if (!record)
      return res.code(NOT_FOUND).send({ status: false, message: "Not found!" });

    const confirmation = await table.RequirementsModel.deleteById(req);
    if (confirmation) {
      const data = record.docs.map(async (doc) => {
        await deleteFile(doc);
      });

      await Promise.all(data);
    }

    res.send({ status: true, message: "Deleted." });
  } catch (error) {
    console.log(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
}

export default {
  create: create,
  get: get,
  getById: getById,
  deleteById: deleteById,
};
