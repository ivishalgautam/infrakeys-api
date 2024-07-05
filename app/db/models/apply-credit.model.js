"use strict";
import { DataTypes, QueryTypes } from "sequelize";
import constants from "../../lib/constants/index.js";

let ApplyCreditModel = null;

const init = async (sequelize) => {
  ApplyCreditModel = sequelize.define(
    constants.models.APPLY_CREDIT_TABLE,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        onDelete: "CASCADE",
        allowNull: false,
        references: {
          model: constants.models.USER_TABLE,
          key: "id",
        },
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      turnover: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      funds_required: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await ApplyCreditModel.sync({ alter: true });
};

const create = async (req) => {
  return await ApplyCreditModel.create(
    {
      user_id: req.user_data.id,
      company_name: req.body.company_name,
      turnover: req.body.turnover,
      funds_required: req.body.funds_required,
      industry: req.body.industry,
    },
    { returning: true, raw: true }
  );
};

const update = async (req, id) => {
  const [rowCount, rows] = await ApplyCreditModel.update(
    {
      user_id: req.body.user_id,
      company_name: req.body.company_name,
      turnover: req.body.turnover,
      funds_required: req.body.funds_required,
      industry: req.body.industry,
    },
    {
      where: { id: req.params.id || id },
      returning: true,
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const getById = async (req, id) => {
  const query = `
    SELECT
        ac.*,
        usr.name,
        usr.phone,
        usr.email
    FROM ${constants.models.APPLY_CREDIT_TABLE} ac
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = ac.user_id
    WHERE ac.id = '${req.params.id || id}'
      `;

  return await ApplyCreditModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await ApplyCreditModel.destroy({
    where: { id: req.params.id || id },
  });
};

const get = async (req) => {
  const query = `
SELECT
    ac.*,
    usr.name,
    usr.phone,
    usr.email
FROM ${constants.models.APPLY_CREDIT_TABLE} ac
LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = ac.user_id
  `;

  return await ApplyCreditModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  update: update,
  getById: getById,
  deleteById: deleteById,
  get: get,
};
