import dotenv = require("dotenv")
const mongoose = require("mongoose");

dotenv.config()
mongoose.connect(process.env.DATABASE_URL);

const userSchema =  mongoose.Schema({
    username : String,
    email : {type : String, unique : true},
    password : String,
    awsKey : String,
    awsSecret : String,
    awsRegion : String
})

const User = mongoose.model("User", userSchema);
export default User

