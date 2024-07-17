"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let CategoryModel = null;

const init = async (sequelize) => {
  CategoryModel = sequelize.define(
    constants.models.CATEGORY_TABLE,
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
      image: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      banners: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await CategoryModel.sync({ alter: true });
};

const create = async (req) => {
  return await CategoryModel.create({
    name: req.body?.name,
    slug: req.body?.slug,
    image: req.body?.image,
    banners: req.body?.banners,
    faq: req.body?.faq,
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
      cat.id,
      cat.name,
      cat.slug,
      cat.image,
      cat.is_featured,
      (
        SELECT COUNT(sc.id)
        FROM sub_categories sc
        WHERE sc.category_id = cat.id
      ) AS total_sub_categories,
      JSON_AGG(subcat.*) as sub_categories
    FROM
      categories cat
      LEFT JOIN sub_categories subcat ON subcat.category_id = cat.id
    ${whereClause}
    GROUP BY cat.id
    ORDER BY cat.created_at
  `;

  const [rows] = await CategoryModel.sequelize.query(query, {
    replacements: { ...queryParams },
    raw: true,
  });

  return rows;
};

const update = async (req, id) => {
  const [rowCount, rows] = await CategoryModel.update(
    {
      name: req.body?.name,
      slug: req.body?.slug,
      image: req.body?.image,
      banners: req.body?.banners,
      faq: req.body?.faq,
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
  return await CategoryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getBySlug = async (req, slug) => {
  const query = `
  SELECT
      cat.*,
      JSON_AGG(subcat.*) as top_sub_categories
    FROM categories as cat
    LEFT JOIN sub_categories subcat on cat.id = subcat.category_id
    WHERE cat.slug = '${req.params.slug || slug}'
    GROUP BY cat.id
  `;

  return await CategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await CategoryModel.destroy({
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
