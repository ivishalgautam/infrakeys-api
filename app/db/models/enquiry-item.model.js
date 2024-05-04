"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";

const { DataTypes, QueryTypes, Deferrable } = sequelizeFwk;

let EnquiryItemModel = null;

const init = async (sequelize) => {
  EnquiryItemModel = sequelize.define(
    constants.models.ENQUIRY_ITEM_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      enquiry_id: {
        type: DataTypes.STRING,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.ENQUIRY_TABLE,
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
      pending_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      in_transit_percentage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      delivered_percentage: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.ENUM(
          "pending",
          "available",
          "not_available",
          "partially_available"
        ),
        defaultValue: "pending",
      },
      filters: { type: DataTypes.JSONB, defaultValue: "[]" },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await EnquiryItemModel.sync({ alter: true });
};

const create = async (req) => {
  return await EnquiryItemModel.create({
    enquiry_id: req.body?.enquiry_id,
    product_id: req.body?.product_id,
    quantity: req.body?.quantity,
    quantity_type: req.body?.quantity_type,
    filters: req.body?.filters,
  });
};

const get = async (req) => {
  const query = `
    SELECT
      o.id,
      o.user_id,
      o.status,
      json_agg(json_build_object(
        'id', ei.id,
        'enquiry_id', ei.enquiry_id,
        'product_id', ei.product_id,
        'quantity', ei.quantity,
        'available_quantity', ei.available_quantity,
        'comment', ei.comment,
        'status', ei.status,
        'title', prd.title,
        'product_slug', prd.slug,
        'pictures', prd.pictures
      )) as items
    FROM enquiries enq
    LEFT JOIN enquiry_items ei ON ei.enquiry_id = enq.id
    LEFT JOIN products prd ON prd.id = ei.product_id
    WHERE enq.user_id = '${req?.user_data?.id}'
    GROUP BY
        o.id,
        o.user_id,
        o.status
  `;

  return await EnquiryItemModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await EnquiryItemModel.update(
    {
      available_quantity: req.body?.available_quantity,
      comment: req.body?.comment,
      pending_percentage: req.body?.pending_percentage,
      in_transit_percentage: req.body?.in_transit_percentage,
      delivered_percentage: req.body?.delivered_percentage,
      base_rate: req.body?.base_rate,
      gst_percentage: req.body?.gst_percentage,
      total_amount: req.body?.total_amount,
      status: req.body?.status,
    },
    {
      where: {
        id: id,
      },
      returning: true,
      raw: true,
      plain: true,
    }
  );

  return rows;
};

const getById = async (req, id) => {
  return await EnquiryItemModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await EnquiryItemModel.destroy({
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
