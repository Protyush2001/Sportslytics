const Joi = require('joi');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user-model'); 
const cors = require('cors');
const {userRegisterSchemaValidation,userLoginSchemaValidation} = require('../validations/user-validation'); 
const userController = {};


userController.register = async (req, res) => {
  const body = req.body;


  const { error, value } = userRegisterSchemaValidation.validate(body, { abortEarly: false });
  if (error) return res.status(400).send(error.details[0].message);

  try {
 
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).send('Email already registered');
    }


    const allowedRoles = ["admin", "player", "team_owner", "general_user"];
    let role = value.role;

    if (!role) {
      role = "general_user"; 
    } else if (!allowedRoles.includes(role)) {
      return res.status(400).send("Invalid role");
    }


    const user = new User({
      ...value,
      role, 
    });


    const salt = await bcryptjs.genSalt();
    user.password = await bcryptjs.hash(user.password, salt);


    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error('Something went wrong:', err);
    return res.status(500).send('Error registering user');
  }
};




userController.login = async (req, res) => {
    const body = req.body;
    const { error, value } = userLoginSchemaValidation.validate(body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ errors: error.details });
    }

    try {
        const user = await User.findOne({ email: value.email });

        if (!user) {
            return res.status(401).json({ message: "Email not found, please check your email" });
        }

        const isMatch = await bcryptjs.compare(value.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

       
        const tokenData = {
            userId: user._id,
            role: user.role,
            username: user.username 
        };

        const token = jwt.sign(tokenData, 'secret@123', { expiresIn: '7d' });
        console.log("Generated JWT Token:", token);

        res.status(200).json({
            message: "Login successful",
            token: token,
            role: user.role, 
              user: {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  }

        });

        console.log("Login successful:", user.role);

    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

userController.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' });
    res.status(200).json(pendingUsers);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
userController.approveUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = 'approved';
    await user.save();

    res.status(200).json({ message: "User approved successfully", user });
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

userController.rejectUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = 'rejected';
    await user.save();

    res.status(200).json({ message: "User rejected successfully", user });
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = userController;