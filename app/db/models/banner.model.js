"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let BannerModel = null;

const init = async (sequelize) => {
  BannerModel = sequelize.define(
    constants.models.BANNER_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
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
  await BannerModel.sync({ alter: true });
};

const create = async (req) => {
  return await BannerModel.create({
    image: req.body.image,
    category_id: req.body.category_id,
  });
};

const get = async (req) => {
  let query = `
    SELECT
        b.*,
        cat.slug as category_slug,
        cat.id as category_id,
        cat.name as category_name
        FROM banners b
        LEFT JOIN categories cat on cat.id = b.category_id
    `;
  return await BannerModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await BannerModel.update(
    {
      image: req.body.image,
      category_id: req.body.category_id,
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
  return await BannerModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const deleteById = async (req, id) => {
  return await BannerModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  deleteById: deleteById,
};
