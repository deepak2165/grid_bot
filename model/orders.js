import mongoose from "mongoose";

const order_schema = mongoose.Schema({
    bot_id: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    side: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
    placed_at_price: {
        type: Number,
        required: true
    },
    executed_at_price: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: ""
    },
    order_id: {
        type: String,
        default: "",
    },
    is_executed: {
        type: Boolean,
        default: false
    },
    is_placed: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true,
    },
});


export default mongoose.model("orders", order_schema);