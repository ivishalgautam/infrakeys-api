"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let NewsCategoryModel = null;

const init = async (sequelize) => {
  NewsCategoryModel = sequelize.define(
    constants.models.NEWS_CATEGORY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      faq: {
        type: DataTypes.JSONB,
        defaultValue: "[]",
      },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_variant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await NewsCategoryModel.sync({ alter: true });
};

const create = async (req) => {
  return await NewsCategoryModel.create({
    name: req.body?.name,
    slug: req.body?.slug,
    is_featured: req.body?.is_featured,
    meta_title: req.body?.meta_title,
    meta_description: req.body?.meta_description,
    meta_keywords: req.body?.meta_keywords,
  });
};

const get = async (req) => {
  const whereConditions = [];
  const queryParams = {};
  let whereClause = "";

  if (req.query.featured) {
    whereConditions.push("cat.is_featured = true");
  }

  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  let query = `
  SELECT
      cat.*
    FROM ${constants.models.NEWS_CATEGORY_TABLE} cat
    ${whereClause}
    GROUP BY cat.id
    ORDER BY cat.created_at
  `;

  const [rows] = await NewsCategoryModel.sequelize.query(query, {
    replacements: { ...queryParams },
    raw: true,
  });

  return rows;
};

const update = async (req, id) => {
  const [rowCount, rows] = await NewsCategoryModel.update(
    {
      name: req.body?.name,
      slug: req.body?.slug,
      is_featured: req.body?.is_featured,
      meta_title: req.body?.meta_title,
      meta_description: req.body?.meta_description,
      meta_keywords: req.body?.meta_keywords,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await NewsCategoryModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
    plain: true,
  });
};

const getBySlug = async (req, catSlug) => {
  const slug = req.params.slug || catSlug;

  const query = `
  SELECT
      cat.id, cat.name, cat.slug, cat.faq, cat.is_featured, cat.meta_title, 
      cat.meta_description, cat.meta_keywords
    FROM ${constants.models.NEWS_CATEGORY_TABLE} as cat
    WHERE cat.slug = :slug
  `;

  return await NewsCategoryModel.sequelize.query(query, {
    replacements: { slug },
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await NewsCategoryModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
};
