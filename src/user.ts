import { Request, Response } from "express";
import User from "./db";
import dotenv from "dotenv"
import { signInBody, signUpBody } from "./zod";
const jwt = require("jsonwebtoken")
import AWS, { Route53 } from "aws-sdk"

dotenv.config()
const express = require("express")
const userRouter = express.Router();
const jwt_secret = process.env.JWT_SECRET;

userRouter.get("/", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization
        const decode = await jwt.verify(token, jwt_secret)
        const response = await User.findById(decode.userId)
        if (!response) {
            return res.status(404).json("User not found")
        }
        return res.status(200).json({ username: response.username })
    } catch (err) {
        return res.status(404).json("Not verified")
    }
})

userRouter.post("/signup", async (req: Request, res: Response) => {
    try {
        const body = req.body
        const isValid = signUpBody.safeParse(body)
        if (!isValid.success) {
            return res.status(403).json({
                message: "Wrong Body"
            })
        }

        try {
            AWS.config.update({
                region: body.awsRegion,
                accessKeyId: body.awsKey,
                secretAccessKey: body.awsSecret
            })
            const route53 = new AWS.Route53();
            const isValidCredential = await route53.listHostedZones().promise()
        } catch (err) {
            return res.status(403).json({
                message: "Invalid AWS Credentials"
            })
        }
        
        const user = new User(body)
        const response = await user.save();
        const token = jwt.sign({ userId: response._id }, jwt_secret);
        return res.json({
            token
        })
    } catch (err) {
        return res.status(404).json({
            message: "Email already exists"
        })
    }

})

userRouter.post("/signin", async (req: Request, res: Response) => {
    try {
        const body = req.body
        const isValid = signInBody.safeParse(body)
        if (!isValid.success) {
            return res.status(403).json({
                message: "Wrong Body"
            })
        }
        const response = await User.findOne({ email: body.email, password: body.password })
        if (!response) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        const token = jwt.sign({ userId: response._id }, jwt_secret);
        return res.status(200).json({
            token
        })
    } catch (err) {
        return res.status(500).json({
            message: "Internal Server error"
        })
    }

})

export default userRouter;



