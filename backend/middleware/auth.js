const JWTServices = require('../services/jwt')
const User = require('../models/user');
const UserDTO = require('../dto/user');

const auth = async (req, res, next)=>{
    try{
        //refresh, access token validation
    const {refreshToken, accessToken} = res.cookies;

    if(!refreshToken || !accessToken){
        const error = {
            status: 401,
            message: 'Unathorized'
        }
        return next(error);
    }

    //verification
    let _id;
    try{
        _id = JWTServices.verifyAccessToken(accessToken)._id;

    }catch(error){
        return next(error);
    }

    //using id to find user data
    let user;
    try{
        user = await  User.findOne({_id: _id});

         
    }catch(error){
        return next(error);
    }

    const userDTO = new UserDTO(user);
    req.user = UserDTO;
    next();
    }catch(error){
        return next(error)
    }
    
}

module.exports = auth;