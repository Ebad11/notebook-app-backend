const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');


const JWT_SECRET = 'welcomeMyUser'

const passwordValidator = (value) => {
     // Define regular expressions for uppercase, lowercase, and special characters.
     const uppercaseRegex = /[A-Z]/;
     const lowercaseRegex = /[a-z]/;
     const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/;
   
     // Check if the password meets all the criteria.
     if (
       uppercaseRegex.test(value) &&
       lowercaseRegex.test(value) &&
       specialCharRegex.test(value)
     ) {
       return true; // Password meets the requirements.
     } else {
          throw new Error('Password must contain a combination of uppercase, lowercase, and special characters!'); // Password does not meet the requirements.
     }
   };

//ROUTE1: Create new user (Signup) using POST "/api/auth/createuser". No login required
router.post('/createuser', [
     //Validators
     body('name', 'Enter a valid name').isLength({ min: 3 }),
     body('email', 'Enter a valid email').isEmail(),
     body('password', 'Enter a longer password').isLength({ min: 5 }),
     body('password').custom(passwordValidator)
],

     async (req, res) => {

          //Validate Entries
          const result = validationResult(req);
          let success=false;
          //Invalid Entry
          if (!result.isEmpty()) {
               return res.status(400).json({success, error: result.array() });
          }

          //Check whether user with same email exists or not
          try {
               let user = await User.findOne({ email: req.body.email });
               if (user) {
                    return res.status(400).json({success, error:[ {msg:"Sorry a user with this email already exists. If that's you login instead of signing up!"}]})
               }

          //User doesnot exist so create user and hash password 
               const salt = await bcrypt.genSalt(10);
               const secPass = await bcrypt.hash(req.body.password, salt);
               console.log(secPass);


          //Create user
               user = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: secPass
               })

               //Creating authToken
               const data = {
                    user: {
                         id: user.id
                    }
               }
               const authToken = jwt.sign(data, JWT_SECRET);
               success=true;
               // Sending Auth token
               res.json({success, authToken });
          }
          catch (error) {
               console.error(error.message);
               res.status(500).send("Internal server Error")
          }

     });


//ROUTE 2: Authenticating a user (Login)

router.post('/login', [
     //Validators
     body('email', 'Enter a valid email').isEmail(),
     body('password', 'Password cannot be blank').notEmpty(),
],
     async (req, res) => {
          const result = validationResult(req);
          let success=false;
          //Invalid Entry don't bother server
          if (!result.isEmpty()) {
               return res.status(400).json({ success, error: result.array() });
          }

          const { email, password } = req.body;

          try {

               //Search for matching email
               const user = await User.findOne({ email });

               //Email doesnt exist
               if (!user) {
                   return res.status(400).json({ success, error: "Please enter correct email" })
               }

               //Email exists so compare pasasword
               const passwordCompare = await bcrypt.compare(password, user.password);

               //Wrong Password
               if (!passwordCompare) {
                    return res.status(400).json({ success, error: "Please enter correct password" })
               }

              //Email and password valid so send authToken
               //Creating authToken
               const data = {
                    user: {
                         id: user.id
                    }
               }
               const authToken = jwt.sign(data, JWT_SECRET);
               success=true;
               // Sending Auth token
               res.json({success, authToken });

               
          } 
          catch (error) {
               console.error(error.message);
               res.status(500).send("Internal server Error")
          }
     });

//ROUTE 3: Get logged in user details using /getuser. Login required

router.post('/getuser', fetchuser, async (req,res)=>{
     try {
          userId= req.user.id;
          const user= await User.findById(userId).select("-password");
          res.send(user);

     }  catch (error) {
          console.error(error.message);
          res.status(500).send("Internal server Error")
     }

})

module.exports = router