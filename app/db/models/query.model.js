"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { QueryTypes } from "sequelize";
const { DataTypes, Deferrable } = sequelizeFwk;

let UserQueryModel = null;

const init = async (sequelize) => {
  UserQueryModel = sequelize.define(
    constants.models.QUERY_TABLE,
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
      type: { type: DataTypes.ENUM("buy", "sell"), allowNull: false },
      pincode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_gst: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await UserQueryModel.sync({ alter: true });
};

const create = async (req, user_id) => {
  return await UserQueryModel.create({
    user_id: user_id,
    type: req.body.type,
    pincode: req.body.pincode,
    company: req.body.company,
    company_gst: req.body.company_gst,
    message: req.body.message,
  });
};

const get = async (req) => {
  let query = `
  SELECT 
      qr.*,
      usr.name,
      usr.email,
      usr.phone
    FROM queries qr
    LEFT JOIN users usr ON usr.id = qr.user_id
    ORDER BY qr.created_at DESC
  `;
  return await UserQueryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getById = async (req, id) => {
  let query = `
  SELECT 
      qr.*,
      usr.name,
      usr.email,
      usr.phone
    FROM queries qr
    LEFT JOIN users usr ON usr.id = qr.user_id
    WHERE qr.id = '${req.params.id || id}'
  `;

  return await UserQueryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await UserQueryModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  deleteById: deleteById,
};
