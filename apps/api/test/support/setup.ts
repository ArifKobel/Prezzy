import "reflect-metadata";
import { TEST_DATABASE_URL, TEST_JWT_SECRET } from "./test-database";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
