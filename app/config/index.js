"use strict";
import "dotenv/config";

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.INFRA_PORT = process.env.INFRA_PORT || 3001;

const config = {
  port: parseInt(process.env.INFRA_PORT, 10),
  // postgres creds
  pg_database_name: process.env.INFRA_PG_DATABASE_NAME,
  pg_username: process.env.INFRA_PG_USERNAME,
  pg_password: process.env.INFRA_PG_PASSWORD,
  pg_host: process.env.PG_HOST,
  pg_dialect: process.env.INFRA_DB_DIALECT,

  // jwt secret key
  jwt_secret: process.env.JWT_SECRET,
  jwt_refresh_secret: process.env.JWT_SECRET,
  smtp_from_email: process.env.SMTP_EMAIL || "tech.bdseducation@gmail.com",
  smtp_port: parseInt(process.env.SMTP_PORT) || 465,
  smtp_host: process.env.SMTP_SERVER || "smtp.gmail.com",
  smtp_password: process.env.SMTP_PASSWORD || "fzblfszihsuwmphl",

  // interakt
  interakt_api_key: process.env.INTERACT_API_KEY,
  interakt_template_name: process.env.INTERACT_TEMPLATE_NAME,
};

export default config;
