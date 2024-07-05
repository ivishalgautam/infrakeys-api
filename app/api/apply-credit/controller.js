"use strict";
import table from "../../db/models.js";

const create = async (req, res) => {
  try {
    res.send(await table.ApplyCreditModel.create(req));
  } catch (error) {
    res.code(500).send({ message: error.message, error });
  }
};

const update = async (req, res) => {
  try {
    const record = await table.ApplyCreditModel.getById(req);
    if (!record) return res.code(404).send({ message: "Not found!" });

    res.send(await table.ApplyCreditModel.update(req));
  } catch (error) {
    res.code(500).send({ message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.ApplyCreditModel.getById(req);
    if (!record) return res.code(404).send({ message: "Not found!" });

    res.send(record);
  } catch (error) {
    res.code(500).send({ message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.ApplyCreditModel.getById(req);
    if (!record) return res.code(404).send({ message: "Not found!" });

    res.send(await table.ApplyCreditModel.deleteById(req));
  } catch (error) {
    res.code(500).send({ message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    const records = await table.ApplyCreditModel.get(req);
    res.send(records);
  } catch (error) {
    res.code(500).send({ message: error.message, error });
  }
};

export default {
  create: create,
  update: update,
  getById: getById,
  deleteById: deleteById,
  get: get,
};
