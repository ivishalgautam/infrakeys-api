"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

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
      meta_title: { type: DataTypes.TEXT, allowNull: true },
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

  // const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  // const limit = req.query.limit ? parseInt(req.query.limit) : 9999999;
  // const offset = (page - 1) * limit;

  const query = `
    SELECT
      prd.id,
      prd.title,
      prd.slug,
      prd.status,
      prd.custom_properties,
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
            WHERE sc.id = prd.sub_category_id
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
    FROM
      ${constants.models.PRODUCT_TABLE} prd
      LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} sc ON sc.id = prd.sub_category_id
      LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = ANY(sc.category_ids)
    ${whereClause}
    GROUP BY
      prd.id
    ORDER BY
      prd.updated_at DESC
    `;
  // LIMIT :limit OFFSET :offset;
  const products = await ProductModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  // const countQuery = `
  //   SELECT COUNT(prd.id) AS total
  //   FROM products prd
  //   LEFT JOIN sub_categories sc ON sc.id = prd.sub_category_id
  //   ${whereClause};
  // `;

  // const [{ total }] = await ProductModel.sequelize.query(countQuery, {
  //   replacements: queryParams,
  //   type: QueryTypes.SELECT,
  //   raw: true,
  // });

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
        json_agg(
          json_build_object(
            'id', cat.id,
            'name', cat.name,
            'slug', cat.slug
          )
        ) as categories
      FROM
        products prd
      LEFT JOIN sub_categories subcat ON subcat.id = prd.sub_category_id
      LEFT JOIN categories cat ON cat.id = ANY(subcat.category_ids)
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
      prd.id,
      prd.title,
      prd.slug,
      prd.custom_properties
    FROM
      ${constants.models.PRODUCT_TABLE} prd
      LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON prd.sub_category_id = subcat.id
      LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = ANY(subcat.category_ids)
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
      prd.id,
      prd.title,
      prd.slug,
      prd.custom_properties
    FROM
      products prd
      LEFT JOIN sub_categories subcat ON prd.sub_category_id = subcat.id
      WHERE subcat.slug = '${slug}' AND prd.status = 'published'
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

const countProducts = async (last_30_days = false) => {
  let whereClause = {};
  if (last_30_days) {
    whereClause = {
      created_at: {
        [Op.gte]: moment().subtract(30, "days").toDate(),
      },
    };
  }

  const conditions = [
    { status: "published" },
    { status: "draft" },
    { status: "pending" },
  ];

  const results = await Promise.all(
    conditions.map(async (condition) => {
      const count = await ProductModel.count({
        where: {
          ...whereClause,
          ...condition,
        },
      });
      return {
        [condition.status]: count.toString(),
      };
    })
  );

  const resultObj = {};

  results.forEach((item) => Object.assign(resultObj, item));
  return resultObj;
};

const searchProducts = async (req) => {
  const q = req.query.q.split("-").join(" ");
  if (!q) return [];

  const query = `
    SELECT
      p.id, p.title, p.slug, p.tags
    FROM products AS p
    LEFT JOIN sub_categories subcat ON subcat.id = p.sub_category_id
    LEFT JOIN categories cat ON cat.id = ANY(subcat.category_ids)
    WHERE 
      (p.title ILIKE '%${q}%' 
      OR EXISTS (
        SELECT 1 
        FROM unnest(p.tags) AS tag 
        WHERE tag ILIKE '%${q}%'
      ) OR subcat.name ILIKE '%${q}%' OR cat.name ILIKE '%${q}%')
      AND p.status = 'published'
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
  countProducts: countProducts,
};
