const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel');
const validateMongoDbId = require('../utils/validateMongodbId');
const generateRefreshToken = require('../config/refreshtoken');
const jwt = require("jsonwebtoken");
const sendEmail = require('./emailController');
const crypto = require("crypto");


// Create a User
const createUser = async (req, res) => {
    console.log(req.body);

    const email = req.body.email;

    const findUser = await User.findOne({email:email});
    if(!findUser){
        const newUser = await User.create(req.body);
        res.status(201).send(newUser);
        
    }else{
        res.json({
            msg: "User Already Exists",
            success:false
        })
    }
}

// Login a user
const loginUserCtrl = async (req, res) => {
    const { email, password } = req.body;
    // console.log(email, password);
    // check if user exists or not
    const findUser = await User.findOne({ email });
    console.log(findUser);
    if(findUser?.isBlocked){
      res.json({
        message:"Admin has blocked this ID."
      })
    }
    else if (findUser && (await findUser.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findUser?._id);
      const updateuser = await User.findByIdAndUpdate(
        findUser.id,
        {
          refreshToken: refreshToken,
        },
        { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({
        _id: findUser?._id,
        firstname: findUser?.firstname,
        lastname: findUser?.lastname,
        email: findUser?.email,
        mobile: findUser?.mobile,
        token: generateToken(findUser?._id),
        success: true
      });
    } else {
      res.json({
        message:"Invalid Credentials"
      })
    }
  }

// handle refresh token

const handleRefreshToken = async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  // console.log(user);
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
};

// logout functionality

const logout = async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate({refreshToken},{  refreshToken: "", });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
};

  // Get all users

const getallUser = async (req, res) => {
    try {
      const getUsers = await User.find();
      res.json(getUsers);
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };

  // Get a single user

const getaUser = async (req, res) => {
    const { id } = req.params;
    // console.log(id)
    validateMongoDbId(id);
  
    try {
      const getaUser = await User.findById(id);
      res.json({
        getaUser,
      });
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };


// Update a user

const updatedUser = async (req, res) => {
  
    const { _id } = req.user;
    
    validateMongoDbId(_id);
  
    try {
      const updatedUser = await User.findByIdAndUpdate(_id,
        {
          firstname: req?.body?.firstname,
          lastname: req?.body?.lastname,
          email: req?.body?.email,
          mobile: req?.body?.mobile,
        },
        {
          new: true,
        }
      );
      res.json(updatedUser);
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };
  

// Delete a single user

const deleteaUser = async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
  
    try {
      const deleteaUser = await User.findByIdAndDelete(id);
      res.json({
        deleteaUser,
      });
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };

  const blockUser = async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
  
    try {
      const blockusr = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: true,
        },
        {
          new: true,
        }
      );
      res.json({
        blockusr:blockusr,
        message: "User Blocked"
      });
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };
  
  const unblockUser = async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
  
    try {
      const unblock = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: false,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "User UnBlocked",
      });
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      })
    }
  };

  const updatePassword = async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if (password) {
      user.password = password;
      const updatedPassword = await user.save();
      res.json(updatedPassword);
    } else {
      res.json(user);
    }
  };

  const forgotPasswordToken = async (req, res) => {
    const { email } = req.body;
    console.log("Email ID: ",email);
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) throw new Error("User not found with this email");
    try {
      const token = await user.createPasswordResetToken();
      await user.save();
      const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</>`;
      const data = {
        to: email,
        text: "Hey User",
        subject: "Forgot Password Link",
        html: resetURL,
      };
      sendEmail(data);
      res.json(token);
    } catch (error) {
      console.log(error);
      res.json({
        message:error
      });
    }
  };

  const resetPassword = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error(" Token Expired, Please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
  };


module.exports = {createUser, loginUserCtrl, handleRefreshToken, logout, getallUser, getaUser, updatedUser, deleteaUser, blockUser, unblockUser, updatePassword, forgotPasswordToken, resetPassword};

// if(!findUser){
// const user = new User(req.body);

// user.save().then((user) => {
//     res.status(201).send(user);
// }).catch((error) => {
//     res.status(400).send(error);
// })
// }