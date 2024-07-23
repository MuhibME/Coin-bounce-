const jwt = require('jsonwebtoken');
//secret key made wih node crypto lib
const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET} = require('../config/index');
const Refreshtoken = require('../models/token');

class JWTServices{
    //static methods, so new object does not have to be made
    //sign access token

    static signAccessToken(payload, expiryTime){
        return jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn: expiryTime});
    }

    //sign refresh token 
    static signRefreshToken(payload, expiryTime){
        return jwt.sign(payload,REFRESH_TOKEN_SECRET,{expiresIn: expiryTime});
    }

    //verify access token
    static verifyAccessToken(token){
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }

    //verify refresh token
    static verifyRefreshToken(token){ 
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }

    //store refresh token
    static async storeRefreshToken(token){
        try{
            //token constructor
            const newToken = new Refreshtoken({
                token: token,
                userId: userId
            });
            //store in db
            await newToken.save();
        }catch(error){
            console.log(error);
        }
    }
}

module.exports = JWTServices;