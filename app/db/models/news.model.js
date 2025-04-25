"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let NewsModel = null;

const init = async (sequelize) => {
  NewsModel = sequelize.define(
    constants.models.NEWS_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      short_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      category: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.NEWS_CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      poster_name: { type: DataTypes.STRING, defaultValue: "" },
      poster_url: { type: DataTypes.STRING, defaultValue: "" },
      meta_title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await NewsModel.sync({ alter: true });
};

const create = async (req) => {
  return await NewsModel.create(
    {
      title: req.body.title,
      slug: String(req.body.slug).toLowerCase(),
      image: req.body.image,
      short_description: req.body.short_description,
      content: req.body.content,
      is_active: req.body.is_active,
      category: req.body.category,
      poster_name: req.body.poster_name,
      poster_url: req.body.poster_url,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
    },
    { returning: true, raw: true }
  );
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  const category = req.query.category ?? null;
  if (category && category !== "all") {
    whereConditions.push(`ncat.slug = :catSlug`);
    queryParams.catSlug = category;
  }

  if (req.query.featured) {
    whereConditions.push("nw.is_active = true");
  }

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  let query = `
  SELECT 
    nw.id, nw.title, nw.image, nw.slug, nw.short_description, nw.created_at, nw.updated_at,
    ncat.name as category_name
    FROM ${constants.models.NEWS_TABLE} nw
    LEFT JOIN ${constants.models.NEWS_CATEGORY_TABLE} ncat ON ncat.id = nw.category
    ${whereClause}
    ORDER BY nw.created_at DESC
  `;

  return await NewsModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await NewsModel.update(
    {
      title: req.body.title,
      slug: req.body.slug,
      image: req.body.image,
      short_description: req.body.short_description,
      categories: req.body.categories,
      content: req.body.content,
      is_active: req.body.is_active,
      poster_name: req.body.poster_name,
      poster_url: req.body.poster_url,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      faq: req.body.faq,
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
  return await NewsModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
  });
};

const getBySlug = async (req, slug) => {
  let query = `
  SELECT 
      nw.*,
      cat.name as category_name
    FROM ${constants.models.NEWS_TABLE} nw
    LEFT JOIN ${constants.models.NEWS_CATEGORY_TABLE} cat ON cat.id = nw.category
    WHERE nw.slug = '${req.params.slug || slug}'
  `;

  return await NewsModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getByCategorySlug = async (req, slug) => {
  let query = `
  SELECT 
      nw.*,
      cat.name as category_name
    FROM ${constants.models.NEWS_TABLE} nw
    LEFT JOIN ${constants.models.NEWS_CATEGORY_TABLE} cat ON cat.id = nw.category
    WHERE cat.slug = '${req.params.slug || slug}'
  `;

  return await NewsModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getRelatedNews = async (req, id) => {
  let query = `
  SELECT
      n2.*
    FROM ${constants.models.NEWS_TABLE} n1
    JOIN ${constants.models.NEWS_TABLE} n2 ON n1.category = n2.category AND n2.id != n1.id
    WHERE n1.id = '${req.params.id || id}'
  `;

  return await NewsModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
  });
};

const deleteById = async (req, id) => {
  return await NewsModel.destroy({
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
  getRelatedNews: getRelatedNews,
  getByCategorySlug: getByCategorySlug,
};
