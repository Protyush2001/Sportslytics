

// const authenticateUser = (req,res,next)=>{
//     // const token = req.headers['authorization'];
//      const authHeader = req.headers['authorization'];
//     const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

//     if(!token){
//         return res.status(401).json({error:'token not provided'});
//     }
//     try{
//         let tokenData = jwt.verify(token,'secret@123');
//         console.log('token data',tokenData);
//         req.userId = tokenData.userId;
//         next();
//     }catch(err){
//         return res.status(401).json({error:err.message});
//     }
// }
// module.exports = authenticateUser;


const jwt = require('jsonwebtoken');
require('dotenv').config();


const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header not provided' });
  }


  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  try {
    const tokenData = jwt.verify(token, process.env.JWT_SECRET); 
    console.log('Token data:', tokenData);

    req.user = { _id: tokenData.userId,
      role: tokenData.role
 };
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

module.exports = authenticateUser;
