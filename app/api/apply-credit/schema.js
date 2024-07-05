export const schema = {
  post: {
    body: {
      type: "object",
      properties: {
        company_name: { type: "string", minLength: 1 },
        turnover: { type: "string", minLength: 1 },
        funds_required: { type: "string", minLength: 1 },
        industry: { type: "string", minLength: 1 },
      },
      required: ["company_name", "turnover", "funds_required", "industry"],
    },
  },
  put: {
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        company_name: { type: "string", minLength: 1 },
        turnover: { type: "string", minLength: 1 },
        funds_required: { type: "string", minLength: 1 },
        industry: { type: "string", minLength: 1 },
      },
    },
  },

  checkParam: {
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
  },
};
