const jwt = require('jsonwebtoken');
const redis = require('redis');

const redisClient = redis.createClient(process.env.REDIS_URI);


const signToken = (email) => {
  const jwtPayload = { email };
  return jwt.sign(jwtPayload, 'JWT_SECRET_KEY', { expiresIn: '2 days' });
};


//set token in redis and return a promise
const setToken = (token, id) => Promise.resolve(redisClient.set(token, id));


//create jwt token, return user data
const createSession = (user) => {
  const { email, id } = user;
  const token = signToken(email);
  return setToken(token, id)
    .then(() => {
      return { success: 'true', userId: id, token, user }
    })
    .catch(console.log);
};


//handleSignin only returns promise
const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return Promise.reject('incorrect form submission');
  }

  return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then((user) => user[0])
          .catch((err) => Promise.reject('unable to get user'));
      } else {
        return Promise.reject('wrong credentials');
      }
    })
    .catch((err) => Promise.reject('Error!'));
};


const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers;
  return redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(401).send('Unauthorized');
    }
    return res.json({id: reply})
  });
};


const signinAuthentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;

  return authorization ? getAuthTokenId(req, res) 
    :handleSignin(db, bcrypt, req, res)
    .then((data) => {
      return data.id && data.email ? createSession(data) : Promise.reject(data)
    })
    .then((session) => res.json(session))
    .catch((err) => res.status(400).json(err));
};


module.exports = {
  signinAuthentication,
  redisClient
};