"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let SubCatModel = null;

const init = async (sequelize) => {
  SubCatModel = sequelize.define(
    constants.models.SUB_CATEGORY_TYPE_TABLE,
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
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await SubCatModel.sync({ alter: true });
};

const create = async (req) => {
  return await SubCatModel.create({
    name: req.body.name,
    slug: req.body.slug,
  });
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  let query = `
  SELECT 
      sct.*,
      COUNT(sc.id) as sub_categories
    FROM
      sub_category_types sct
      LEFT JOIN sub_categories sc ON sc.type = sct.id
    GROUP BY
      sct.id
  `;

  return await SubCatModel.sequelize.query(query, {
    replacements: {},
    type: QueryTypes.SELECT,
    order: [["created_at", "DESC"]],
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await SubCatModel.update(
    {
      name: req.body.name,
      is_featured: req.body.is_featured,
      slug: req.body.slug,
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
  return await SubCatModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getBySlug = async (req, slug) => {
  return await SubCatModel.findOne({
    where: {
      slug: req.params.slug || slug,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await SubCatModel.destroy({
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
