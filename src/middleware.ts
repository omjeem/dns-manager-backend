import { Request, Response } from "express";
import User from "./db";
import AWS from "aws-sdk"
const jwt = require("jsonwebtoken");

interface CustomRequest extends Request {
    userId: string;
}

export async function middleware(req: CustomRequest, res: Response, next: Function) {
    const token = req.headers.authorization;
    try {
        if (!token) {
            return res.status(402).json({
                message: "Token not found"
            });
        }
        const decode = await jwt.verify(token, process.env.JWT_SECRET);
        const userId = decode.userId;
        const userData = await User.findOne({ _id: userId });
        if (!userData) {
            return res.status(403).json({
                message: "User not found"
            })
        }
        AWS.config.update({
            accessKeyId: userData.awsKey,
            secretAccessKey: userData.awsSecret,
            region: userData.awsRegion
        })
        req.userId = userId;
        next();
    } catch (err) {
        return res.status(403).json({
            message: "Invalid Token"
        })
    }
}