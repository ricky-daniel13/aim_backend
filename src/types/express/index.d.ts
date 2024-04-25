import { User } from "../user";
import { Express } from "express-serve-static-core";

export {};

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
