import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/config';

export const checkToken = (req: Request, res: Response, next: NextFunction) => {
    //ge t the jwt token from the head
    const token = <string>req.headers['auth'];
    let jwtPayload;

    // try to validate the token and get data
    try {
        jwtPayload = <any>jwt.verify(token, config.jwtSecret);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        // if token is not valid, respond with 401 (unauthorized)
        res.status(401).send();
        return;
    }

    // the token is valid for 1 hour
    // we want to send a new token on every request
    const { userId, username } = jwtPayload;
    const newToken = jwt.sign({ userId, username }, config.jwtSecret, {
        expiresIn: '1h',
    });
    res.setHeader('token', newToken);

    // call the next middleware or controller
    next();
};
