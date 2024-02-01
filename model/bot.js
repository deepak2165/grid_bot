import mongoose from "mongoose";

const bot_schema = mongoose.Schema({
    bot_id: {
        type: String,
        required: true,
    },
    pair:{
        type: String,
        required: true,
    },
    upper_limit:{
        type: Number,
        required: true,
    },
    lower_limit:{
        type: Number,
        required: true
    },
    grid_level:{
        type: Number,
        required: true,
    },
    investment:{
        type: Number,
        required: true
    },
    step_size:{
        type: Number,
        required: true,
    },
    mode: {
        type: String,
        required: true,
    },
    is_started: {
        type: Boolean,
        default: true,
    },
    is_stoped: {
        type: Boolean,
        default: false,
    }
},{
    timestamps:{
        createdAt: true,
        updatedAt: true,
    }
});

export default mongoose.model("bots", bot_schema);