"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let RequirementModel = null;

const init = async (sequelize) => {
  RequirementModel = sequelize.define(
    constants.models.REQUIREMENT_TABLE,
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
        primaryKey: true,
      },
      requirement_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.STRING,
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
      docs: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await RequirementModel.sync({ alter: true });
};

const create = async (req) => {
  return await RequirementModel.create({
    user_id: req.user_data?.id,
    docs: req.body?.docs,
    requirement_id: req.body?.requirement_id,
  });
};

const get = async (req, id) => {
  let whereQuery = "";

  if (req.user_data.role === "user") {
    whereQuery = `WHERE pnts.user_id = '${req.user_data.id}'`;
  }

  let query = `
    SELECT
        rqmnt.*,
        usr.name,
        usr.phone,
        usr.id as user_id,
        enq.id as enquiry_id,
        ord.id as order_id
      FROM ${constants.models.REQUIREMENT_TABLE} rqmnt
      LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = rqmnt.user_id
      LEFT JOIN ${constants.models.ENQUIRY_TABLE} enq ON enq.requirement_reference = rqmnt.id
      LEFT JOIN ${constants.models.ORDER_TABLE} ord ON ord.requirement_reference = rqmnt.id
      ${whereQuery}
      ORDER BY rqmnt.created_at DESC
    `;

  return await RequirementModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};
const getById = async (req, id) => {
  return await RequirementModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });
};

const getByUserId = async (user_id) => {
  return await RequirementModel.findOne({
    where: {
      user_id: user_id,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await RequirementModel.destroy({
    where: { id: req.params.id || id },
  });
};
const deleteByUserId = async (user_id) => {
  return await RequirementModel.destroy({
    where: { user_id: user_id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  getByUserId: getByUserId,
  deleteById: deleteById,
  deleteByUserId: deleteByUserId,
};
