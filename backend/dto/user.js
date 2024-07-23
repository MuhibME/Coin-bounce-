//DTO is used to move data between processes

class UserDTO{
    constructor(user){
        this._id = user._id,
        this.username = user.username,
        this.email = user.email
    }
}


module.exports = UserDTO