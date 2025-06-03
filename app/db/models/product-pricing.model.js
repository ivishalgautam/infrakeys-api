"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

let ProductPricingModel = null;

const init = async (sequelize) => {
  ProductPricingModel = sequelize.define(
    constants.models.PRODUCT_PRICING_TABLE,
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      slug: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      custom_properties: { type: DataTypes.JSONB, defaultValue: [] },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: constants.models.PRODUCT_PRICING_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        onDelete: "CASCADE",
      },
      is_variant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      pricing: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      meta_title: { type: DataTypes.TEXT, allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_keywords: { type: DataTypes.TEXT, allowNull: true },
    },
    { createdAt: "created_at", updatedAt: "updated_at" }
  );

  await ProductPricingModel.sync({ alter: true });
};

const create = async (req) => {
  return await ProductPricingModel.create({
    title: req.body.title,
    slug: req.body.slug,
    custom_properties: req.body.custom_properties,
    product_id: req.body.product_id,
    pricing: req.body.pricing,
    percentage: req.body.percentage,
    meta_title: req.body.meta_title,
    meta_description: req.body.meta_description,
    meta_keywords: req.body.meta_keywords,
  });
};

const updateById = async (req, id) => {
  const [rowCount, rows] = await ProductPricingModel.update(
    {
      title: req.body.title,
      slug: req.body.slug,
      custom_properties: req.body.custom_properties,
      product_id: req.body.product_id,
      pricing: req.body.pricing,
      percentage: req.body.percentage,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
    },
    {
      where: { id: req.params.id || id },
      returning: true,
      raw: true,
    }
  );

  return rows[0];
};
const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  const searchQuery = req.query?.q?.split("+").join(" ");

  if (!req.user_data?.role) {
    whereConditions.push("prd.status = 'published'");
  }

  if (req.query.featured) {
    whereConditions.push(`prd.is_featured = true`);
  }

  if (searchQuery) {
    whereConditions.push(
      `prd.title ILIKE '%${searchQuery}%' OR EXISTS (
        SELECT 1 
        FROM unnest(prd.tags) AS tag 
        WHERE tag ILIKE '%${searchQuery}%'
      ) OR sc.name ILIKE '%${searchQuery}%' OR cat.name ILIKE '%${searchQuery}%'`
    );
  }

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  const query = `
    SELECT
      prd.id, prd.title, prd.slug, prd.status, prd.custom_properties,
      (
        SELECT JSON_AGG(
          JSONB_BUILD_OBJECT(
            'id', cat.id,
            'name', cat.name,
            'slug', cat.slug
          )
        )
        FROM ${constants.models.CATEGORY_TABLE} cat
        WHERE cat.id = ANY(
          (
            SELECT sc.category_ids
            FROM ${constants.models.SUB_CATEGORY_TABLE} sc
            WHERE sc.id = prd.product_id
          )::uuid[]
        )
      ) as categories,
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'id', sc.id,
          'name', sc.name,
          'slug', sc.slug
        )
      ) as sub_categories
    FROM ${constants.models.PRODUCT_TABLE} prd
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} sc ON sc.id = prd.product_id
    LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = ANY(sc.category_ids)
    ${whereClause}
    GROUP BY prd.id
    ORDER BY prd.updated_at DESC
    `;

  const products = await ProductPricingModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  return {
    data: products,
  };
};

const getById = async (req, id) => {
  let query = `
        SELECT
          *
        FROM products 
        WHERE id = '${req.params.id || id}';
`;

  return await ProductPricingModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getBySlug = async (req, slug) => {
  let query = `  
      SELECT
        prd.*,
        CASE
          WHEN COUNT(rp.id) > 0 THEN json_agg(rp.*)
          ELSE '[]'::json
        json_agg(
          json_build_object(
            'id', cat.id,
            'name', cat.name,
            'slug', cat.slug
          )
        ) as categories
      FROM
        products prd
      LEFT JOIN sub_categories subcat ON subcat.id = prd.product_id
      LEFT JOIN categories cat ON cat.id = ANY(subcat.category_ids)
      LEFT JOIN products rp ON rp.product_id = subcat.id AND rp.id != prd.id
      WHERE prd.slug = '${req.params.slug || slug}'
      GROUP BY
        prd.id, cat.name, cat.slug;
`;
  return await ProductPricingModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await ProductPricingModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  updateById: updateById,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
};
