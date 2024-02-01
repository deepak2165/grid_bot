import Binance from "node-binance-api";
import bot from "../model/bot.js";
import orders from "../model/orders.js";
import config from "../config.js";

const binance = new Binance().options({
    APIKEY: config.BINANCE_API_KEY,
    APISECRET: config.BINANCE_SECRET_KEY,
    urls: {
        base: "https://testnet.binance.vision/api/"   // testnet endpoint
    },
    family: 4
});

const create_bot = async (req, res) => {
    try {
        if (req.body) {
            const bot_id = Math.floor(100000 + Math.random() * 900000);
            console.log("here")
            // step size in arithmetic mode is calculated using formula [(upper_limit - lower_limit) / no_of_grids ] although
            // in 3 commas step size is calculated by formula [upper_limit - lower_limit) / (no_of_grids - 1)]
            const step_size = req.body.mode == 1 ? (req.body.upper_limit - req.body.lower_limit) / (req.body.grids - 1) : (Math.pow(req.body.upper_limit/req.body.lower_limit, 1 / (req.body.grids-1)) -1 ) * 100;
            // if mode == 1 it means bot started in arithmetic mode otherwise bot will start in geometric mode
            
            const bot_data = await bot.create({
                bot_id: bot_id,
                pair: req.body.pair,
                upper_limit: req.body.upper_limit,
                lower_limit: req.body.lower_limit,
                grid_level: req.body.grids,
                investment: req.body.investment,
                mode: req.body.mode,
                step_size: step_size,
            });
            const amount_per_level = req.body.investment / (req.body.grids - 1);
        
            if (req.body.mode == 1) {
                console.log(amount_per_level)
                
                const ticker = await binance.prices();
                const pair_current_price = parseInt(ticker.BTCUSDT);
                const quantity = (amount_per_level / pair_current_price).toFixed(5);
                let i = 0;
                while (i < bot_data.grid_level - 1) {
                    console.log("here 3")
                    const price = (bot_data.lower_limit + i * step_size).toFixed(2);

                    await orders.create({
                        bot_id: bot_id,
                        symbol: bot_data.pair,
                        side: "BUY",
                        type: "LIMIT",
                        placed_at_price: price,
                        quantity: quantity,
                    });
                    i++;
                }
            } else if (req.body.mode == "2"){
                
                let price = bot_data.lower_limit;
                const amount_per_level = req.body.investment / (req.body.grids-1)
                let i = 0;
                while (i < bot_data.grid_level - 1) {
                    console.log(step_size)
                    const quantity = (amount_per_level / price).toFixed(5);

                    await orders.create({
                        bot_id: bot_id,
                        symbol: bot_data.pair,
                        side: "BUY",
                        type: "LIMIT",
                        placed_at_price: price,
                        quantity: quantity,
                    });
                    price = price + (price * step_size / 100);
                    
                   
                    i++;
                }
            }

        } else {
            console.log("EMPTY BODY:      ");
        }

    } catch (error) {
        console.log(error);
    }
}

const stop_bot = async (req, res) => {
    try {
        if(req.query.botId) {
            const bot_data = await bot.findOne({bot_id: req.query.botId, is_stoped: false});
            if(bot_data) {
                const cancel_bot_orders = await orders.updateMany({bot_id: bot_data.bot_id, status: "NEW"},{
                    $set:{
                        status: "CANCELED",
                        is_placed: false,
                    }
                });
                console.log(cancel_bot_orders);
                const stop_bot_data = await bot.updateOne({bot_id: bot_data.bot_id}, {
                    $set:{
                        is_stoped: true,
                    }
                })
                console.log(stop_bot_data);
            } else {
                console.log("NO BOT WITH THE GIVEN BOT ID FOUND");
            }
        }
    } catch (error) {
        console.log(error);
    }
}


export {
    create_bot,
    stop_bot
}