const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    const authentificationHeader = req.headers['authorization']; //obtin headerul

    if (!authentificationHeader) {
        return res.status(401).send({message: 'No authorization header provided.'});
    }

    const tokenParts = authentificationHeader.split(' '); // Bearer {token} => [0] = bearer si [1]=token jwt

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).send({message: 'Malformed authorization header.'});
    }

    const token = tokenParts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).send({message: 'Failed to authenticate token.'});
        }

        req.user = decoded; //in req user am informtiile userului autentificat
        next();
    });
};



