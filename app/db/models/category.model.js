"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, QueryTypes } from "sequelize";
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
        allowNull: true,
      },
      banners: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
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
      category_id: {
        type: DataTypes.UUID,
        onDelete: "CASCADE",
        allowNull: true,
        references: {
          model: constants.models.CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
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
    is_variant: req.body?.is_variant,
    category_id: req.body?.category_id,
  });
};

const get = async (req) => {
  const whereConditions = ["cat.is_variant = false"];
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
        WHERE cat.id = ANY(sc.category_ids)
      ) AS total_sub_categories,
      JSON_AGG(
        CASE
          WHEN subcat.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', subcat.id,
              'name', subcat.name,
              'slug', subcat.slug
            )
          END
      ) as sub_categories
    FROM
      categories cat
      LEFT JOIN sub_categories subcat ON cat.id = ANY(subcat.category_ids)
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

const getVariants = async (req) => {
  let query = `
  SELECT
      cat.id,
      cat.name
    FROM
      ${constants.models.CATEGORY_TABLE} cat
    WHERE cat.category_id = '${req.params.id}'
    ORDER BY cat.created_at
  `;

  return await CategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getVariantsBySlug = async (req) => {
  const { slug } = req.params;
  let query = `
  SELECT
      catv.id,
      catv.name,
      catv.slug,
      catv.is_variant,
      cat.slug as category_slug
    FROM
      ${constants.models.CATEGORY_TABLE} cat
    LEFT JOIN ${constants.models.CATEGORY_TABLE} catv ON catv.category_id = cat.id
    WHERE cat.slug = :slug
    ORDER BY cat.created_at
  `;

  return await CategoryModel.sequelize.query(query, {
    replacements: { slug },
    type: QueryTypes.SELECT,
    raw: true,
  });
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
      cat.id,
      cat.name,
      cat.slug,
      COALESCE(cat.image, cat2.image) as image,
      COALESCE(cat.banners, cat2.banners) as banners,
      cat.faq,
      cat.is_featured,
      cat.meta_title,
      cat.meta_description,
      cat.meta_keywords,
      cat.is_variant,
      cat.category_id,
      cat2.slug as main_slug,
      COALESCE(JSON_AGG(
        CASE
          WHEN subcat.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', subcat.id,
              'name', subcat.name,
              'slug', subcat.slug,
              'image', subcat.image
            )
          END
      ) FILTER (WHERE subcat.id IS NOT NULL), '[]') as top_sub_categories
    FROM ${constants.models.CATEGORY_TABLE} as cat
    LEFT JOIN ${constants.models.CATEGORY_TABLE} as cat2 ON cat.category_id = cat2.id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON cat.id = ANY(subcat.category_ids) OR cat2.id = ANY(subcat.category_ids)
    WHERE cat.slug = :slug
    GROUP BY cat.id, cat2.slug, cat2.image, cat2.banners
  `;

  return await CategoryModel.sequelize.query(query, {
    replacements: { slug },
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
  getVariants: getVariants,
  getVariantsBySlug: getVariantsBySlug,
};
