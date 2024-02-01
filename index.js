import Binance from "node-binance-api";
import config from "./config.js";
import bot from "./model/bot.js";
import orders from "./model/orders.js";
import router from "./modules/botRoutes.js";
import './core/connection.js';
import './helper/execute_bots.js';
import express from 'express';
const app = express();


app.use(express.urlencoded());
app.use(express.json());

app.use('/bot', router);

const port =  5000;

app.listen(port, ()=>{
    console.log(`SERVER STARTED AT PORT: ${port}`);
})