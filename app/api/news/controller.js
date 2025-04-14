"use strict";
import slugify from "slugify";
import table from "../../db/models.js";

const create = async (req, res) => {
  try {
    req.body.slug = slugify(req.body.slug ? req.body.slug : req.body.title);
    res.send(await table.NewsModel.create(req));
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const update = async (req, res) => {
  try {
    const record = await table.NewsModel.getById(req);
    if (!record) return res.code(404).send({ message: "News not found!" });

    req.body.slug = slugify(req.body.slug ? req.body.slug : req.body.title);
    res.send(await table.NewsModel.update(req));
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.NewsModel.getById(req);
    if (!record) return res.code(404).send({ message: "News not found!" });

    res.send(record);
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const getBySlug = async (req, res) => {
  try {
    const record = await table.NewsModel.getBySlug(req);
    if (!record) return res.code(404).send({ message: "News not found!" });
    console.log({ record });
    res.send(record);
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const getByCategorySlug = async (req, res) => {
  try {
    const record = await table.NewsModel.getByCategorySlug(req);
    if (!record) return res.code(404).send({ message: "News not found!" });

    res.send(record ?? []);
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const getRelatedNews = async (req, res) => {
  try {
    const record = await table.NewsModel.getById(req);
    if (!record) return res.code(404).send({ message: "News not found!" });

    const data = await table.NewsModel.getRelatedNews(req);

    console.log({ data });

    res.send(data);
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.NewsModel.getById(req);
    if (!record) return res.code(404).send({ message: "News not found!" });

    res.send(await table.NewsModel.deleteById(req));
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    res.send(await table.NewsModel.get(req));
  } catch (error) {
    console.error(error);
    res.code(500).send({ message: error.message, error });
  }
};

export default {
  create: create,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
  get: get,
  getRelatedNews: getRelatedNews,
  getByCategorySlug: getByCategorySlug,
};
