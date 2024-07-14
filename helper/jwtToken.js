const jwt = require("jsonwebtoken");
let jwtSecretKey = "anilsaini";

const generateToken = (data) => {
    const token = jwt.sign(data, jwtSecretKey);
    return token;
};

const verifyToken = (token) => {
    try{
        const valid = jwt.verify(token, jwtSecretKey);
        return valid;
    }catch(error){
        return error;
    }
};

module.exports  = {
    generateToken:generateToken,
    verifyToken: verifyToken
}