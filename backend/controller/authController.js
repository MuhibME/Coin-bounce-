///logics and routes
const joi = require('joi');
const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const User = require('../models/user');
const bcrypt = require('bcrypt');
const userDTO = require('../dto/user.js');
const JWTServices = require('../services/jwt');
const refreshTokenModel = require('../models/token') 

const authController = {
   
    async register(req,res,next){
        //validating user using lib joi
        const userRegisterSchema = joi.object({
            username: joi.string().min(5).max(30).required(),
            name: joi.string().max(30).required(),
            email: joi.string().email().required(),
            password: joi.string().pattern(pattern).required(),
            confirmPassword: joi.ref('password')
        });
        const {error} = userRegisterSchema.validate(req.body);

        //returning error -- using middleware
        if (error){
            return next(error);
        }

        //checking if email or username is already in use and throwing an error
        const {username , name , email , password} = req.body;
        try{
            const emailInUse = await User.exists({email});
            const usernameInUse = await User.exists({username});

            if (emailInUse){
                const error = {
                    status: 409,
                    message: 'Email already in user'
                }
                return next(error);
            }

            if (usernameInUse){
                const error = {
                    status: 409,
                    message: 'Userame not available'
                }
                return next(error);
            }
        }catch(error){
            return next(error)
        }
        //passwor hash -- using lib bcrypt.js
        const hashedPassword = await bcrypt.hash(password,10);

        //token intigration
        let accessToken;
        let refreshToken;
        let user;

        try{
            const userToRegister = new User({
                username: username,
                email: email,
                name: name,
                password: hashedPassword,
            });
            //DB store data
             user = await userToRegister.save();

            //token generation
            accessToken = JWTServices.signAccessToken({_id: user._id,},'30m');
            refreshToken = JWTServices.signRefreshToken({_id: user._id,}, '60m');
        }catch(error){
            return next(error);
        }

        //store refresh token in db
        await JWTServices.storeRefreshToken(refreshToken, user._id);

        //set token through cookie
        res.cookie('accessToken', accessToken, {
            maxAge: 1000*60*60*24,
            httpOnly: true //makes it so client side cant access this cookie, only serverside , helps reduce xss

        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000*60*60*24,
            httpOnly: true
        });
        
    
        //response
        const userDTO = new UserDTO(user);
        return res.status(201).json({userDTO, auth: true});
    },



    async login(req,res,next){
        //Validating user input
        const userLoginSchema = joi.object({
            username: joi.string().min(5).max(30).required(),
            password: joi.string().pattern(pattern)
        });

        //error handling
        const {error} = userLoginSchema.validate(req.body);
        if(error){
            return next(error);
        }

        //deobjectifying user 
        const {username , password} = req.body
        //user matching
        
        let user;
        try{
            //username matching
           const user =  await User.findOne({username: username});

           if(!user){
            const error = {
                status:401,
                message: 'Invalid Usernare'
            }
            return next(error);
           }

           //password hash match
           const match = await bcrypt.compare(password,user.password);
           if(!user){
            const error = {
                status:401,
                message: 'Invalid Password' 
            }
            return next(error);
           }
        }catch(error){
            return next(error)
        }
        const accessToken = JWTServices.signAccessToken({_id: user._id}, '30m');
        const refreshToken = JWTServices.signRefreshToken({_id: user._id},'60m');

        //update refresh token using model in db   
        try{
        await refreshTokenModel.updateOne({_id: user._id},{token: refreshToken},{upsert: true});
        }catch(error){
            return next(error)
        }

        //set token in cookies
        res.cookie('accessToken', accessToken, {maxAge:1000*60*60*24,httpOnly:true});
        res.cookie('accessToken', refreshToken, {maxAge:1000*60*60*24,httpOnly:true});
        
        const userDTO = new UserDTO(user);
        return res.status(200).json({userDTO, auth: true});
    },

    async logout(req, res, next){
        //delete refresh token from db
        const {refreshToken} = req.cookies;
        try{
            await refreshTokenModel.deleteOne({token: refreshToken});
        }catch(error){
            return next(error);
        }
        //delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        //response 
        res.status(200).json({user: null, auth: false});
    },

    async refresh(req,res,next){
        //get refreshToken from cookies
        //verify refresh token
        //generate new tokens
        //update db, return response 

        const originalRefreshToken = req.cookies.refreshToken;
        let _id;
        try{
            _id = JWTServices.verifyRefreshToken(originalRefreshToken)._id;
            
        }catch(e){
            const error = {
                status: 401,
                message: 'Unauthorized'
            }
            return next(error);
        }
        try{
            const match = await refreshTokenModel.findOne({_id:_id , token: originalRefreshToken});
            if(!match){
                const error = {
                    status: 401,
                    message: 'Unauthorized'
                }
                return next(error);
            }
        }catch(error){
                return next(error);
            }

        //generate new tokens
        //update db, return response 
        try{
            const accessToken = JWTServices.signAccessToken({_id: _id}, '30m');
            const refreshToken = JWTServices.signRefreshToken({_id: _id}, '60m');
            refreshTokenModel.updateOne({_id: _id}, {token: refreshToken});
            res.cookie('accessToken', accessToken, {maxAge:1000*60*60*24,httpOnly:true});
        res.cookie('accessToken', refreshToken, {maxAge:1000*60*60*24,httpOnly:true});
        }catch(e){
            return next(e);
        }
        const user = await User.findOne({_id: _id});
        const userDTO = new UserDTO(user);
        return res.status(200).json({user: userDTO, auth: true});
    },
    
}


module.exports = authController;