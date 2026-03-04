import { Hono } from "hono";
import {
  initDepositLend,
  confirmDepositLend,
  cancelLend,
} from "../controllers/lend.controllers";

const ghostRoute = new Hono();

ghostRoute.post("/deposit-lend/init", initDepositLend);
ghostRoute.post("/deposit-lend/confirm", confirmDepositLend);
ghostRoute.post("/cancel-lend", cancelLend);

export default ghostRoute;
