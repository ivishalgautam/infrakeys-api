"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let ProductModel = null;

const init = async (sequelize) => {
  ProductModel = sequelize.define(
    constants.models.PRODUCT_TABLE,
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
      description: { type: DataTypes.TEXT, allowNull: false },
      custom_description: { type: DataTypes.JSONB, defaultValue: "[]" },
      custom_properties: { type: DataTypes.JSONB, defaultValue: "[]" },
      tags: { type: DataTypes.ARRAY(DataTypes.STRING), default: [] },
      sku: { type: DataTypes.STRING, allowNull: false },
      sub_category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SUB_CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      status: {
        type: DataTypes.ENUM("published", "draft", "pending"),
        defaultValue: "pending",
      },
      is_featured: { type: DataTypes.BOOLEAN, deafaultValue: false },
      related_products: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        deafaultValue: [],
      },
      quantity_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      meta_title: { type: DataTypes.STRING, allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_keywords: { type: DataTypes.TEXT, allowNull: true },
    },
    { createdAt: "created_at", updatedAt: "updated_at" }
  );

  await ProductModel.sync({ alter: true });
};

const create = async (req) => {
  return await ProductModel.create({
    title: req.body.title,
    slug: req.body.slug,
    description: req.body.description,
    custom_description: req.body.custom_description,
    custom_properties: req.body.custom_properties,
    tags: req.body.tags,
    sku: req.body.sku,
    sub_category_id: req.body.sub_category_id,
    status: req.body.status,
    is_featured: req.body.is_featured,
    related_products: req.body.related_products,
    quantity_types: req.body.quantity_types,
    meta_title: req.body.meta_title,
    meta_description: req.body.meta_description,
    meta_keywords: req.body.meta_keywords,
  });
};
const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  if (!req.user_data?.role) {
    whereConditions.push("prd.status = 'published'");
  }

  if (req.query.featured) {
    whereConditions.push(`prd.is_featured = true`);
  }

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  // const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  // const limit = req.query.limit ? parseInt(req.query.limit) : 9999999;
  // const offset = (page - 1) * limit;

  const query = `
    SELECT
      prd.*,
      sc.name AS sub_category_name,
      sc.slug AS sub_category_slug,
      cat.name AS category_name,
      cat.slug AS category_slug
    FROM
      products prd
      LEFT JOIN sub_categories sc ON sc.id = prd.sub_category_id
      LEFT JOIN categories cat ON cat.id = sc.category_id
    ${whereClause}
    ORDER BY prd.updated_at DESC
    `;
  // LIMIT :limit OFFSET :offset;
  // console.log(query);
  const products = await ProductModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  const countQuery = `
    SELECT COUNT(prd.id) AS total
    FROM products prd
    LEFT JOIN sub_categories sc ON sc.id = prd.sub_category_id
    ${whereClause};
  `;

  const [{ total }] = await ProductModel.sequelize.query(countQuery, {
    replacements: queryParams,
    type: QueryTypes.SELECT,
    raw: true,
  });

  return {
    data: products,
    // total_page: Math.ceil(Number(total) / Number(limit)),
    // page: page,
  };
};

const updateById = async (req, id) => {
  const [rowCount, rows] = await ProductModel.update(
    {
      title: req.body.title,
      slug: req.body.slug,
      description: req.body.description,
      custom_description: req.body.custom_description,
      custom_properties: req.body.custom_properties,
      tags: req.body.tags,
      sku: req.body.sku,
      sub_category_id: req.body.sub_category_id,
      status: req.body.status,
      is_featured: req.body.is_featured,
      related_products: req.body.related_products,
      quantity_types: req.body.quantity_types,
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

const getById = async (req, id) => {
  let query = `
        SELECT
          *
        FROM products 
        WHERE id = '${req.params.id || id}';
`;

  return await ProductModel.sequelize.query(query, {
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
        END AS related_products,
        cat.name as category_name,
        cat.slug as category_slug
      FROM
        products prd
      LEFT JOIN sub_categories subcat ON subcat.id = prd.sub_category_id
      LEFT JOIN categories cat ON cat.id = subcat.category_id
      LEFT JOIN products rp ON rp.sub_category_id = subcat.id AND rp.id != prd.id
      WHERE prd.slug = '${req.params.slug || slug}'
      GROUP BY
        prd.id, cat.name, cat.slug;
`;
  return await ProductModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getByCategory = async (req, slug) => {
  let threshold = "";
  const page = !req?.query?.page
    ? null
    : req?.query?.page < 1
    ? 1
    : req?.query?.page;

  const limit = !req?.query?.limit
    ? null
    : req?.query?.limit
    ? req?.query?.limit
    : 10;

  if (page && limit) {
    const offset = (page - 1) * limit;
    threshold = `LIMIT '${limit}' OFFSET '${offset}'`;
  }

  let query = `
    SELECT
      prd.*,
      cat.name AS category_name,
      cat.slug AS category_slug
    FROM
      products prd
      LEFT JOIN sub_categories subcat ON prd.sub_category_id = subcat.id
      LEFT JOIN categories cat ON cat.id = subcat.category_id
      WHERE cat.slug = '${slug}' AND prd.status = 'published'
      ${threshold}
  `;

  const products = await ProductModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });

  const { total } = await ProductModel.sequelize.query(
    `SELECT COUNT(id) AS total FROM products;`,
    {
      type: QueryTypes.SELECT,
      plain: true,
    }
  );
  return {
    products,
    total_page: Math.ceil(Number(total) / Number(limit)),
    page: page,
  };
};

const getBySubCategory = async (req, slug) => {
  let threshold = "";
  const page = !req?.query?.page
    ? null
    : req?.query?.page < 1
    ? 1
    : req?.query?.page;

  const limit = !req?.query?.limit
    ? null
    : req?.query?.limit
    ? req?.query?.limit
    : 10;

  if (page && limit) {
    const offset = (page - 1) * limit;
    threshold = `LIMIT '${limit}' OFFSET '${offset}'`;
  }

  let query = `
    SELECT
      prd.*,
      cat.name AS category_name,
      cat.slug AS category_slug
    FROM
      products prd
      LEFT JOIN sub_categories subcat ON prd.sub_category_id = subcat.id
      LEFT JOIN categories cat ON cat.id = subcat.category_id
      WHERE subcat.slug = '${slug}'
      ${threshold}
  `;

  const products = await ProductModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });

  const { total } = await ProductModel.sequelize.query(
    `SELECT COUNT(id) AS total FROM products;`,
    {
      type: QueryTypes.SELECT,
      plain: true,
    }
  );
  return {
    products,
    total_page: Math.ceil(Number(total) / Number(limit)),
    page: page,
  };
};

const deleteById = async (req, id) => {
  return await ProductModel.destroy({
    where: { id: req.params.id || id },
  });
};

const searchProducts = async (req) => {
  const q = req.query.q.split("-").join(" ");
  if (!q) return [];

  const query = `
    SELECT
      p.id, p.title, p.slug, p.tags
    FROM products AS p
    WHERE 
      p.title ILIKE '%${q}%' 
      OR EXISTS (
        SELECT 1 
        FROM unnest(p.tags) AS tag 
        WHERE tag ILIKE '%${q}%'
      )
  `;

  // Fetch templates and categories based on the search term
  return await ProductModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
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
  getByCategory: getByCategory,
  getBySubCategory: getBySubCategory,
  searchProducts: searchProducts,
};
