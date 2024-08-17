"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";
const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let SubCategoryModel = null;

const init = async (sequelize) => {
  SubCategoryModel = sequelize.define(
    constants.models.SUB_CATEGORY_TABLE,
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
      category_ids: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
      },
      type: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SUB_CATEGORY_TYPE_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      faq: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
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

  await SubCategoryModel.sync({ alter: true });
};
//
const create = async (req) => {
  return await SubCategoryModel.create({
    name: req.body?.name,
    image: req.body?.image,
    slug: req.body?.slug,
    is_featured: req.body?.is_featured,
    category_ids: req.body?.category_ids,
    type: req.body?.type,
    faq: req.body?.faq,
    meta_title: req.body?.meta_title,
    meta_description: req.body?.meta_description,
    meta_keywords: req.body?.meta_keywords,
  });
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  if (req?.query?.featured) {
    whereConditions.push(`subcat.is_featured = true`);
  }

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  const query = `
    SELECT
        subcat.*,
        JSON_AGG(
          CASE
            WHEN subcat.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', cat.id,
                'name', cat.name,
                'slug', cat.slug
              )
            END
        ) as categories
      FROM sub_categories subcat
      LEFT JOIN categories cat ON cat.id = ANY(subcat.category_ids)
      ${whereClause}
      GROUP BY
       subcat.id
  `;

  return await SubCategoryModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const updateCategoryIds = async (req, id) => {
  let query = `
  UPDATE ${constants.models.SUB_CATEGORY_TABLE} SET category_ids = ARRAY[category_id];
  `;

  const [rowCount, rows] = await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.UPDATE,
  });

  return rows[0];
};

const update = async (req, id) => {
  const [rowCount, rows] = await SubCategoryModel.update(
    {
      name: req.body?.name,
      image: req.body?.image,
      slug: req.body?.slug,
      is_featured: req.body?.is_featured,
      category_ids: req.body?.category_ids,
      type: req.body?.type,
      meta_title: req.body?.meta_title,
      meta_description: req.body?.meta_description,
      meta_keywords: req.body?.meta_keywords,
      faq: req.body?.faq,
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
  let query = `
  SELECT
        sc.*
    FROM
        sub_categories sc
    LEFT JOIN
        products p ON sc.id = p.sub_category_id
    WHERE
        sc.id = '${req.params.id || id}'
    GROUP BY
        sc.id;
  `;

  return await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const getBySlug = async (req, slug) => {
  let query = `
  SELECT
        sc.*
    FROM
        sub_categories sc
    LEFT JOIN
        products p ON sc.id = p.sub_category_id
    WHERE
        sc.slug = '${req.params.slug || slug}'
    GROUP BY
        sc.id;
  `;

  return await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const getByCategory = async (req, slug) => {
  let query = `
  SELECT
        sc.id,
        sc.name,
        sc.slug,
        cat.name as catgeory_name,
        cat.slug as catgeory_slug,
        sct.name as type
    FROM
        sub_categories sc
    LEFT JOIN
        categories cat ON cat.id = ANY(sc.category_ids)
    LEFT JOIN
        sub_category_types sct ON sct.id = sc.type
    WHERE
        cat.slug = '${req.params.slug || slug}'
  `;

  return await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await SubCategoryModel.destroy({
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
  getByCategory: getByCategory,
  deleteById: deleteById,
  updateCategoryIds: updateCategoryIds,
};
