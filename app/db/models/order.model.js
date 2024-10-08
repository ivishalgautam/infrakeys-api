"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Op, where } from "sequelize";

const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let OrderModel = null;

const init = async (sequelize) => {
  OrderModel = sequelize.define(
    constants.models.ORDER_TABLE,
    {
      id: {
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
      order_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "in_transit", "delivered", "quotation"),
        defaultValue: "pending",
      },
      pincode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      delivery_summary: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM(
          "advance",
          "bank_guarantee",
          "letter_of_credit",
          "channel_financing"
        ),
        allowNull: false,
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        onDelete: "SET NULL",
        references: {
          model: constants.models.USER_TABLE,
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      requirement_reference: {
        type: DataTypes.UUID,
        allowNull: true,
        onDelete: "SET NULL",
        references: {
          model: constants.models.REQUIREMENT_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      quotation_file: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await OrderModel.sync({ alter: true });
};

const create = async ({ data }) => {
  return await OrderModel.create(
    {
      id: data?.order_id,
      user_id: data?.user_id,
      pincode: data?.pincode,
      delivery_summary: data?.delivery_summary,
      order_amount: data?.order_amount,
      payment_method: data?.payment_method,
      assigned_to: data?.assigned_to,
      requirement_reference: data?.requirement_reference,
      quotation_file: data?.quotation_file,
    },
    {
      returning: true,
      plain: true,
      raw: true,
    }
  );
};

const get = async (req) => {
  let whereQuery = `WHERE o.user_id = '${req.user_data.id}'`;

  if (req.user_data.role === "admin") {
    whereQuery = "";
  }

  if (req.user_data.role === "subadmin") {
    whereQuery = `WHERE o.assigned_to = '${req.user_data.id}'`;
  }

  const query = `
  SELECT
      o.id, o.status, o.created_at, o.payment_method,
      usr.phone,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', rqr.id,
            'requirement_id', rqr.requirement_id,
            'docs', rqr.docs
          )
        ) FILTER(WHERE rqr.id IS NOT NULL), '[]'
      ) as reference
    FROM ${constants.models.ORDER_TABLE} o
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = o.user_id
    LEFT JOIN ${constants.models.REQUIREMENT_TABLE} rqr ON rqr.id = o.requirement_reference
    ${whereQuery}
    GROUP BY
      o.id,
      usr.phone
    ORDER BY o.created_at DESC
  `;

  return await OrderModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await OrderModel.update(
    {
      status: req.body?.status,
      delivery_time: req.body?.delivery_time,
      assigned_to: req.body?.assigned_to === "" ? null : req.body?.assigned_to,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
      plain: true,
    }
  );

  return rows;
};

const getById = async (id) => {
  const query = `
  SELECT
      o.*,
      json_agg(json_build_object(
        'id', oi.id,
        'enquiry_id', oi.order_id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'quantity_type', oi.quantity_type,
        'comment', oi.comment,
        'status', oi.status,
        'available_quantity', oi.available_quantity,
        'product_title', prd.title,
        'product_slug', prd.slug,
        'base_rate', oi.base_rate,
        'gst_percentage', oi.gst_percentage,
        'total_amount', oi.total_amount,
        'filters', oi.filters
      )) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products prd ON prd.id = oi.product_id
    WHERE o.id = '${id}'
    GROUP BY
        o.id
  `;

  return await OrderModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await OrderModel.destroy({
    where: { id: req.params.id || id },
  });
};

const countOrders = async (last_30_days = false) => {
  return await OrderModel.findAll({
    attributes: [
      [
        OrderModel.sequelize.fn("COUNT", OrderModel.sequelize.col("id")),
        "total_orders",
      ],
    ],
    plain: true,
    raw: true,
  });
};

const countOrderStats = async () => {
  return await OrderModel.findAll({
    attributes: [
      [
        sequelizeFwk.fn("DATE_TRUNC", "month", sequelizeFwk.col("created_at")),
        "date",
      ],
      [sequelizeFwk.fn("COUNT", sequelizeFwk.col("id")), "Orders"],
    ],
    where: {
      created_at: {
        [Op.gte]: sequelizeFwk.literal("CURRENT_DATE - INTERVAL '12 months'"),
      },
    },
    group: [
      sequelizeFwk.fn("DATE_TRUNC", "month", sequelizeFwk.col("created_at")),
    ],
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  deleteById: deleteById,
  countOrders: countOrders,
  countOrderStats: countOrderStats,
};
