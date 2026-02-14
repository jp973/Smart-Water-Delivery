import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { config } from "./config/v1/config";
import { parseJson } from "./utils/v1/package";

const swaggerUrls = config.SWAGGER_URLS?.split(",") || [];

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: parseJson.name,
      description: parseJson.description,
      version: parseJson.version,
    },
    servers: swaggerUrls.map(url => ({ url })),
    components: {
      securitySchemes: {
        adminBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Specify the admin token",
        },
        userBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Specify the user token",
        },
      },
      parameters: {
        XDemoHeader: {
          name: "X-Demo",
          in: "header",
          description: "Set to 'true' to use the demo database, 'false' or omit for main database.",
          required: false,
          schema: {
            type: "string",
            enum: ["true", "false"],
          },
        },
      },
    },
    security: [],
  },
  apis: ["./src/routes/v1/**/*.ts", "./src/db/models/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);
const filePath = path.join(process.cwd(), "public/swagger/main.js");

fs.writeFile(
  filePath,
  `(async () => {
      const docs = document.getElementById('docs');
      const apiDescriptionDocument = ${JSON.stringify(swaggerSpec)};
      docs.apiDescriptionDocument = apiDescriptionDocument;
    })();
`,
  err => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.info("File has been written successfully.");
  },
);
export { swaggerUi, swaggerSpec };
