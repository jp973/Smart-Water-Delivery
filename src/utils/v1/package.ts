import path from "path";
import * as fs from "fs";

const absoluteSdkPath = path.join(process.cwd(), "package.json");
const pJson = fs.readFileSync(absoluteSdkPath, "utf8");
export const parseJson = JSON.parse(pJson);
