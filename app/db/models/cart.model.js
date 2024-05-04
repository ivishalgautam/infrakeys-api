"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";

const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let CartModel = null;

const init = async (sequelize) => {
  CartModel = sequelize.define(
    constants.models.CART_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.PRODUCT_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      filters: { type: DataTypes.JSONB, defaultValue: "[]" },
      item_type: {
        type: DataTypes.ENUM("buy", "sell"),
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await CartModel.sync({ alter: true });
};

const create = async ({ user_id, product_id, item_type, filters }) => {
  return await CartModel.create({
    user_id: user_id,
    product_id: product_id,
    item_type: item_type,
    filters: filters,
  });
};

const get = async (req) => {
  const query = `
    SELECT 
      c.*,
      prd.title,
      prd.description,
      prd.id as product_id,
      prd.quantity_types
    FROM carts c
    LEFT JOIN products prd on prd.id = c.product_id
    WHERE c.user_id = '${req.user_data.id}';
  `;

  return await CartModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getById = async (req, id) => {
  return await CartModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });
};

const getByUserAndProductId = async ({ user_id, product_id, item_type }) => {
  return await CartModel.findOne({
    where: {
      user_id: user_id,
      product_id: product_id,
      item_type: item_type,
    },
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await CartModel.destroy({
    where: { id: req?.params?.id || id },
    returning: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  deleteById: deleteById,
  getByUserAndProductId: getByUserAndProductId,
};
