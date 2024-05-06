"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";

const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let EnquiryModel = null;

const init = async (sequelize) => {
  EnquiryModel = sequelize.define(
    constants.models.ENQUIRY_TABLE,
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
      enquiry_type: { type: DataTypes.ENUM("buy", "sell"), allowNull: false },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "available",
          "partially_available",
          "not_available",
          "closed"
        ),
        defaultValue: "pending",
      },
      pincode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      delivery_summary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      delivery_time: {
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
      po_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      po_file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_converted_to_order: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await EnquiryModel.sync({ alter: true });
};

const create = async (req, enquiry_id) => {
  return await EnquiryModel.create(
    {
      id: enquiry_id,
      user_id: req.body.user_id ?? req.user_data.id,
      pincode: req.body?.pincode,
      enquiry_type: req.body?.enquiry_type,
      delivery_summary: req.body?.delivery_summary,
      delivery_time: req.body?.delivery_time,
      payment_method: req.body?.payment_method,
    },
    {
      returning: true,
      plain: true,
      raw: true,
    }
  );
};

const get = async (req) => {
  let whereQuery = `WHERE enq.user_id = '${req.user_data.id}'`;

  if (req.user_data.role === "admin") {
    whereQuery = "";
  }

  if (req.user_data.role === "subadmin") {
    whereQuery = `WHERE enq.assigned_to = '${req.user_data.id}'`;
  }

  const query = `
    SELECT
      enq.*,
      usr.phone
    FROM enquiries enq
    LEFT JOIN users usr ON usr.id = enq.user_id
    ${whereQuery}
    ORDER BY enq.created_at DESC
  `;

  return await EnquiryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await EnquiryModel.update(
    {
      status: req.body?.status,
      pincode: req.body?.pincode,
      order_amount: req.body?.order_amount,
      delivery_summary: req.body?.delivery_summary,
      po_number: req.body?.po_number,
      po_file: req.body?.po_file,
      is_converted_to_order: req.body?.is_converted_to_order,
      assigned_to: req.body?.assigned_to === "" ? null : req.body?.assigned_to,
    },
    {
      where: {
        id: req?.params?.id || id,
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
        enq.*,
        json_agg(json_build_object(
          'id', ei.id,
          'enquiry_id', ei.enquiry_id,
          'product_id', ei.product_id,
          'quantity', ei.quantity,
          'quantity_type', ei.quantity_type,
          'comment', ei.comment,
          'status', ei.status,
          'available_quantity', ei.available_quantity,
          'product_title', prd.title,
          'product_slug', prd.slug,
          'pending_percentage', ei.pending_percentage,
          'in_transit_percentage', ei.in_transit_percentage,
          'delivered_percentage', ei.delivered_percentage,
          'base_rate', ei.base_rate,
          'gst_percentage', ei.gst_percentage,
          'total_amount', ei.total_amount,
          'filters', ei.filters
        ))as items
      FROM enquiries enq
      LEFT JOIN enquiry_items ei ON ei.enquiry_id = enq.id
      LEFT JOIN products prd ON prd.id = ei.product_id
      WHERE enq.id = '${id}'
      GROUP BY
          enq.id
    `;

  return await EnquiryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await EnquiryModel.destroy({
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
