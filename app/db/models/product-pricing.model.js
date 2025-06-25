"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

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
      place: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      custom_properties: { type: DataTypes.JSONB, defaultValue: [] },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true,
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
      price: {
        type: DataTypes.DOUBLE(10, 2),
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
    price: req.body.price,
    place: req.body.place,
    is_variant: req.body.is_variant,
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
      price: req.body.price,
      place: req.body.place,
      is_variant: req.body.is_variant,
      percentage: req.body.percentage,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
    },
    {
      where: { id: req.params?.id || id },
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

  if (searchQuery) {
    whereConditions.push(`prd.title ILIKE :q`);
    queryParams.q = `%${searchQuery}%`;
  }

  const main = req.query?.main === "1";
  if (main) {
    whereConditions.push(`prd.is_variant IS false`);
  }

  const page = req.query.page ? Number(req.query.page) : 0;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  const query = `
    SELECT
      prd.*
    FROM ${constants.models.PRODUCT_PRICING_TABLE} prd
    ${whereClause}
    GROUP BY prd.id
    ORDER BY prd.created_at DESC
    LIMIT :limit OFFSET :offset
    `;

  const countQuery = `
    SELECT
      COUNT(prd.id) OVER()::integer as total
    FROM ${constants.models.PRODUCT_PRICING_TABLE} prd
    ${whereClause}
    GROUP BY prd.id
    `;

  const pricings = await ProductPricingModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { ...queryParams, limit, offset },
    raw: true,
  });

  const count = await ProductPricingModel.sequelize.query(countQuery, {
    type: QueryTypes.SELECT,
    replacements: { ...queryParams },
    raw: true,
    plain: true,
  });

  return {
    pricings,
    total: count?.total ?? 0,
  };
};

const getById = async (req, id) => {
  let query = `
        SELECT
          *
        FROM ${constants.models.PRODUCT_PRICING_TABLE} 
        WHERE id = '${req.params?.id || id}';
`;

  return await ProductPricingModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    raw: true,
  });
};

const getByMain = async (mainProductId) => {
  return await ProductPricingModel.findAll({
    where: {
      product_id: mainProductId,
    },
  });
};

const getBySlug = async (req, slug) => {
  let query = `  
      SELECT
        prd.*
      FROM
        ${constants.models.PRODUCT_PRICING_TABLE} prd
      WHERE prd.slug = '${req.params.slug || slug}'
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
  getByMain: getByMain,
};
