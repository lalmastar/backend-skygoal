const User = require('../models/userModel');
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    let token;
    if(req.headers?.authorization?.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
        try{
            if(token){
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded?.id);
                req.user = user;
                next()
                // console.log("user: ",user);
            }
        }catch(error){
            // console.log("Not Authorized token expired, Please login again");
            res.json({
                message:"Not Authorized token expired, Please login again"
              })
        }
    }
    else{
        // console.log("There is no token attached to headers");
        res.json({
            message:"There is no token attached to headers"
          })
    }
}

const isAdmin = async (req, res, next) => {
    // console.log(req.user);
    const {email} = req.user;
    const adminUser = await User.findOne({email});
    if(adminUser.role !== "admin"){
        console.log("You are not an admin");
        res.json({
            message:"You are not an admin"
          })
    }
    else{
        next()
    }
}

module.exports = {authMiddleware, isAdmin};
