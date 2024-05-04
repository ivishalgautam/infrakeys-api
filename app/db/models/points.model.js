"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let PointsModel = null;

const init = async (sequelize) => {
  PointsModel = sequelize.define(
    constants.models.POINTS_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.USER_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      points: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await PointsModel.sync({ alter: true });
};

const create = async (req) => {
  return await PointsModel.create({
    user_id: req.body?.user_id,
    points: req.body?.points,
  });
};

const update = async (req, id) => {
  return await PointsModel.update(
    {
      points: req.body?.points,
    },
    {
      where: {
        id: req.params?.id || id,
      },
      returning: true,
      raw: true,
    }
  );
};

const get = async (req, id) => {
  let whereQuery = "";

  if (req.user_data.role === "user") {
    whereQuery = `WHERE pnts.user_id = '${req.user_data.id}'`;
  }

  let query = `
    SELECT
        pnts.*,
        usr.name,
        usr.phone,
        usr.id as user_id
       FROM points pnts
       LEFT JOIN users usr ON usr.id = pnts.user_id
       ${whereQuery}
    `;

  return await PointsModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};
const getById = async (req, id) => {
  return await PointsModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });
};

const getByUserId = async (user_id) => {
  return await PointsModel.findOne({
    where: {
      user_id: user_id,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await PointsModel.destroy({
    where: { id: req.params.id || id },
  });
};
const deleteByUserId = async (user_id) => {
  return await PointsModel.destroy({
    where: { user_id: user_id },
  });
};

export default {
  init: init,
  create: create,
  update: update,
  get: get,
  getById: getById,
  getByUserId: getByUserId,
  deleteById: deleteById,
  deleteByUserId: deleteByUserId,
};
