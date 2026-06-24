import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalizing email to lowercase since we save it as lowercase
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Email",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(404).json({
        message: "Email not found"
      });
    }


    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();


    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;


    await user.save();


    await sendEmail(
      user.email,
      otp
    );


    res.json({
      message: "OTP sent successfully"
    });


  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }


    if (
      user.resetOTP !== otp ||
      user.otpExpiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
    }


    res.json({
      message: "OTP verified",
      email: user.email
    });


  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const resetPassword = async (req,res)=>{
  try {

    const { email, password } = req.body;


    const user = await User.findOne({
      email: email.toLowerCase()
    });


    if(!user){
      return res.status(404).json({
        message:"User not found"
      });
    }


    user.password = await bcrypt.hash(
      password,
      10
    );


    user.resetOTP = undefined;
    user.otpExpiry = undefined;


    await user.save();


    res.json({
      message:"Password reset successful"
    });


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};