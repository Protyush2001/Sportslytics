const Joi = require('joi');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user-model'); // Adjust the path as necessary
const cors = require('cors');
const {userRegisterSchemaValidation,userLoginSchemaValidation} = require('../validations/user-validation'); // Adjust the path as necessary
const userController = {};

// userController.register = async (req, res) => {
// const body = req.body;

//     const { error, value } = userRegisterSchemaValidation.validate(body, { abortEarly: false });
//     if (error) return res.status(400).send(error.details[0].message);

//     try{
//         const existingUser = await User.findOne({ email: value.email });
//         if (existingUser) {
//             return res.status(400).send('Email already registered');
//         }
//         const user = new User(value);
//         const salt = await bcryptjs.genSalt();
//         user.password = await bcryptjs.hash(user.password, salt);
//         await user.save();
//         res.status(201).send('User registered successfully');
//     } catch (err) {
//         console.error('Something went wrong:', err);
//         return res.status(500).send('Error checking existing user');
//     }
    
// }

userController.register = async (req, res) => {
  const body = req.body;

  // Step 1: validate input with your schema
  const { error, value } = userRegisterSchemaValidation.validate(body, { abortEarly: false });
  if (error) return res.status(400).send(error.details[0].message);

  try {
    // Step 2: check if email already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).send('Email already registered');
    }

    // Step 3: validate role
    const allowedRoles = ["admin", "player", "team_owner", "general_user"];
    let role = value.role;

    if (!role) {
      role = "general_user"; // default role
    } else if (!allowedRoles.includes(role)) {
      return res.status(400).send("Invalid role");
    }

    // Step 4: create new user
    const user = new User({
      ...value,
      role, // store role explicitly
    });

    // Step 5: hash password
    const salt = await bcryptjs.genSalt();
    user.password = await bcryptjs.hash(user.password, salt);

    // Step 6: save user
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error('Something went wrong:', err);
    return res.status(500).send('Error registering user');
  }
};


// userController.login =  async (req,res)=>{
//     const body = req.body;
//     const {error,value} =  userLoginSchemaValidation.validate(body,{abortEarly:false});
//     if(error){
//         res.status(400).json({errors:error.details});
//     }
//     try{
//        const user = await User.findOne({email:value.email});
//        const isMatch = await bcryptjs.compare(value.password,user.password);

//         if(!user){
//             res.status(401).json("email not found, please check your email");
//         }
//         if(!isMatch){
//             res.status(400).json("Something went wrong");
//         }

//         const tokenData = {userId: user._id};
//         const token = jwt.sign(tokenData,'secret@123',{expiresIn: '7d'});
//         res.status(200).json({token:token});
//         console.log("Login successful");
        
//     }catch(err){
//         console.error("error:",err);
//         return res.status(500).json({error:"Internal server error"});
//     }
    
// }

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
            username: user.username // changesmade here
        };

        const token = jwt.sign(tokenData, 'secret@123', { expiresIn: '7d' });

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

module.exports = userController;