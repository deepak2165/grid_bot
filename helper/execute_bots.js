import cron from 'node-cron';
import bot from '../model/bot.js';
import orders from '../model/orders.js';
import Binance from "node-binance-api";
import config from '../config.js';

const binance = new Binance().options({
    APIKEY: config.BINANCE_API_KEY,
    APISECRET: config.BINANCE_SECRET_KEY,
    useServerTime: true,
    recvWindow: 60000,
    verbose: true,
    urls: {
        base: "https://testnet.binance.vision/api/"   // testnet endpoint
    },
    family: 4
});

const ticker = await binance.prices();
let pair_current_price = parseInt(ticker.BTCUSDT);

const place_orders = cron.schedule('* * * * *', async () => {
    try {
        const bot_data = await bot.find({ is_started: true });
        if (bot_data.length > 0) {
            for (let i = 0; i < bot_data.length; i++) {

                const bot_orders = await orders.find({ bot_id: bot_data[i].bot_id, is_placed: false });
                for (let j = 0; j < bot_orders.length; j++) {

                    let sell_price =0;

                    const ticker = await binance.prices();
                    pair_current_price = parseInt(ticker.BTCUSDT);
                    if (bot_orders[j].side == "BUY") {
                        if (bot_orders[j].placed_at_price > pair_current_price) {
                            let orderId = Math.floor(1000000 + Math.random() * 9000000);
                            // const buy_at_market = await binance.marketBuy("BTCUSDT", bot_orders[j].quantity);
                            await orders.updateOne({ bot_id: bot_orders[j].bot_id, placed_at_price: bot_orders[j].placed_at_price, is_executed: false }, {
                                $set: {
                                    executed_at_price: pair_current_price,
                                    status: "FILLED",
                                    order_id: orderId,
                                    is_placed: true,
                                    is_executed: true,
                                }
                            });
                            if(bot_data[i].mode == 1) {
                                sell_price = (bot_orders[j].placed_at_price + bot_data[i].step_size).toFixed(2);
                            } else {
                                sell_price = (bot_orders[j].placed_at_price + (bot_orders[j].placed_at_price * bot_data[i].step_size / 100)).toFixed(2);
                                console.log("SELL PRICE ===> ", sell_price);
                            }


                            // const place_sell_order = await binance.sell("BTCUSDT", bot_orders[j].quantity, sell_price);

                            orderId = Math.floor(1000000 + Math.random() * 9000000);

                            await orders.create({
                                bot_id: bot_orders[j].bot_id,
                                symbol: bot_data[i].pair,
                                side: "SELL",
                                type: "LIMIT",
                                placed_at_price: sell_price,
                                quantity: bot_orders[j].quantity,
                                order_id: orderId,
                                status: "NEW",
                                is_placed: true,
                            })
                        } else {

                            // const place_limit_order = await binance.buy("BTCUSDT", bot_orders[j].quantity, bot_orders[j].placed_at_price);
                            let orderId = Math.floor(1000000 + Math.random() * 9000000);
                            await orders.updateOne({ bot_id: bot_orders[j].bot_id, placed_at_price: bot_orders[j].placed_at_price, is_executed: false }, {
                                $set: {
                                    status: "NEW",
                                    order_id: orderId,
                                    is_placed: true,
                                }
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
});

cron.schedule('* * * * * *', () => {
    const fluctuation = Math.floor(Math.random() * 100);
    const direction = Math.floor(Math.random() * 2);
    if(direction == "0") {
        pair_current_price = pair_current_price + fluctuation;
    } else {
        pair_current_price = pair_current_price - fluctuation;
    }
    console.log(pair_current_price);
})

const check_executed_orders = cron.schedule('* * * * * *', async () => {
    try {

        const bot_order = await orders.find({ is_placed: true, is_executed: false, status: "NEW" });
        for (let i = 0; i < bot_order.length; i++) {
            
            const bot_data = await bot.findOne({ bot_id: bot_order[i].bot_id });

            if (bot_order[i].side == "BUY" && bot_order[i].placed_at_price > pair_current_price)
            {
                let sell_price = 0;
                console.log(" Buy current",pair_current_price, "placed",bot_order[i].placed_at_price, bot_order[i].placed_at_price > pair_current_price)
                
                if(bot_data.mode == 1) {
                    sell_price = (bot_order[i].placed_at_price + bot_data.step_size).toFixed(2);
                } else {
                    sell_price = (bot_order[i].placed_at_price + (bot_order[i].placed_at_price * bot_data.step_size / 100)).toFixed(2);
                    console.log("SELL PRICE ===> ", sell_price);
                }
                await orders.updateOne({ bot_id: bot_order[i].bot_id, order_id: bot_order[i].order_id }, {
                    $set: {
                        executed_at_price: pair_current_price,
                        status: "FILLED",
                        is_placed: true,
                        is_executed: true,
                    }
                });

                let orderId = Math.floor(1000000 + Math.random() * 9000000);

                const new_order = await orders.create({
                    bot_id: bot_order[i].bot_id,
                    symbol: bot_order[i].symbol,
                    side: "SELL",
                    type: "LIMIT",
                    placed_at_price: sell_price,
                    quantity: bot_order[i].quantity,
                    order_id: orderId,
                    status: "NEW",
                    is_placed: true,
                })
            } else if (bot_order[i].side == "SELL" && bot_order[i].placed_at_price < pair_current_price) {
                let buy_price = 0;
                console.log("Sell current",pair_current_price, "placed",bot_order[i].placed_at_price, bot_order[i].placed_at_price < pair_current_price)
                if(bot_data.mode == 1) {
                    buy_price = (bot_order[i].placed_at_price - bot_data.step_size).toFixed(2);
                }
                else {
                    buy_price = (bot_order[i].placed_at_price - (bot_order[i].placed_at_price * bot_data.step_size / 100)).toFixed(2);
                }
                await orders.updateOne({ bot_id: bot_order[i].bot_id, order_id: bot_order[i].order_id }, {
                    $set: {
                        executed_at_price: pair_current_price,
                        status: "FILLED",
                        is_placed: true,
                        is_executed: true,
                    }
                });

                let orderId = Math.floor(1000000 + Math.random() * 9000000);

                const new_order = await orders.create({
                    bot_id: bot_order[i].bot_id,
                    symbol: bot_data.pair,
                    side: "BUY",
                    type: "LIMIT",
                    placed_at_price: buy_price,
                    quantity: bot_order[i].quantity,
                    order_id: orderId,
                    status: "NEW",
                    is_placed: true,
                });
            } else {
               // console.log("NO ORDER EXECUTED")
            }
        }

    } catch (error) {
        console.log(error);
    }
})


place_orders.start();

check_executed_orders.start();