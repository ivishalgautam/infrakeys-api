"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";

const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let OrderItemModel = null;

const init = async (sequelize) => {
  OrderItemModel = sequelize.define(
    constants.models.ORDER_ITEM_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.ORDER_TABLE,
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      available_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      base_rate: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      gst_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "in_transit", "delivered"),
        defaultValue: "pending",
      },
      delivery_summary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      filters: { type: DataTypes.JSONB, defaultValue: "[]" },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await OrderItemModel.sync({ alter: true });
};

const create = async (data, order_id) => {
  return await OrderItemModel.create({
    order_id: order_id,
    product_id: data.product_id,
    quantity: data.quantity,
    quantity_type: data.quantity_type,
    available_quantity: data.available_quantity,
    base_rate: data.base_rate,
    gst_percentage: data.gst_percentage,
    total_amount: data.total_amount,
    delivery_summary: data.delivery_summary,
    filters: data.filters,
  });
};

const get = async (req) => {
  const query = `
  SELECT
      o.id,
      o.user_id,
      o.status,
      json_agg(json_build_object(
        'id', oi.id,
        'order_id', oi.order_id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'dispatched_quantity', oi.dispatched_quantity,
        'comment', oi.comment,
        'status', oi.status,
        'title', prd.title,
        'pictures', prd.pictures
      )) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products prd ON prd.id = oi.product_id
    WHERE o.user_id = '${req?.user_data?.id}'
    GROUP BY
        o.id,
        o.user_id,
        o.status
  `;

  return await OrderItemModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const update = async (data, order_item_id) => {
  const [rowCount, rows] = await OrderItemModel.update(
    {
      comment: data.comment,
      status: data.status,
    },
    {
      where: {
        id: order_item_id,
      },
      returning: true,
      raw: true,
      plain: true,
    }
  );

  return rows;
};

const getById = async (req, id) => {
  return await OrderItemModel.findOne({
    where: {
      id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await OrderItemModel.destroy({
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
