"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Op } from "sequelize";

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
      requirement_reference: req.body?.requirement_reference,
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
      enq.id, enq.enquiry_type, enq.is_converted_to_order, enq.status, enq.created_at, enq.payment_method, enq.quotation_file,
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
    FROM ${constants.models.ENQUIRY_TABLE} enq
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = enq.user_id
    LEFT JOIN ${constants.models.REQUIREMENT_TABLE} rqr ON rqr.id = enq.requirement_reference
    ${whereQuery}
    GROUP BY
      enq.id,
      usr.phone
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
      quotation_file: req.body?.quotation_file,
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

const countEnquiries = async (last_30_days = false) => {
  return await EnquiryModel.findAll({
    attributes: [
      [
        EnquiryModel.sequelize.fn("COUNT", EnquiryModel.sequelize.col("id")),
        "total_enquiries",
      ],
    ],
    plain: true,
    raw: true,
  });
};

const countEnquiriesStats = async () => {
  return await EnquiryModel.findAll({
    attributes: [
      [
        sequelizeFwk.fn("DATE_TRUNC", "month", sequelizeFwk.col("created_at")),
        "date",
      ],
      [sequelizeFwk.fn("COUNT", sequelizeFwk.col("id")), "Enquiries"],
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
  countEnquiries: countEnquiries,
  countEnquiriesStats: countEnquiriesStats,
};
