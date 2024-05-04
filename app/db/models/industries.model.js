"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let IndustriesModel = null;

const init = async (sequelize) => {
  IndustriesModel = sequelize.define(
    constants.models.INDUSTRIES_TABLE,
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
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await IndustriesModel.sync({ alter: true });
};

const create = async (req) => {
  return await IndustriesModel.create({
    name: req.body.name,
    image: req.body.image,
    is_featured: req.body.is_featured,
    slug: req.body.slug,
  });
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};

  if (req.query.featured) {
    whereConditions.push("b.is_featured = true");
  }

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  let query = `
  SELECT 
      *
    FROM
      industries ind
  `;

  return await IndustriesModel.sequelize.query(query, {
    replacements: {},
    type: QueryTypes.SELECT,
    order: [["created_at", "DESC"]],
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await IndustriesModel.update(
    {
      name: req.body.name,
      image: req.body.image,
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
  return await IndustriesModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getBySlug = async (req, slug) => {
  return await IndustriesModel.findOne({
    where: {
      slug: req.params.slug || slug,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await IndustriesModel.destroy({
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
