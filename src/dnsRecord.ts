import { Request, Response } from "express"
import { middleware } from "./middleware"
import { Route53 } from "aws-sdk"
import { date, record } from "zod"

const express = require("express")
const dnsRecordRouter = express.Router()

dnsRecordRouter.use(middleware)

dnsRecordRouter.get("/:hostedZoneId", async (req: Request, res: Response) => {
    const hostedZoneId = req.params.hostedZoneId
    if (!hostedZoneId)
        return res.status(403).json({
            message: "Invalid Hosted Zone Id"
        });
    try {
        const params = {
            HostedZoneId: hostedZoneId
        }
        const route53 = new Route53()
        const records = await route53.listResourceRecordSets(params).promise()
        return res.json({
            ResourceRecordSets: records.ResourceRecordSets
        });
    } catch (err: any) {
        if (!err.statusCode)
            return res.status(500).json({
                message: "Internal Server Error"
            });
        return res.status(err.statusCode).json({
            message: err.message
        });
    }
})

dnsRecordRouter.post("/delete/:hostedZoneId", async (req: Request, res: Response) => {
    const hostedZoneId = req.params.hostedZoneId
    if (!hostedZoneId)
        return res.status(403).json({
            message: "Invalid Hosted Zone Id"
        });

    try {
        const params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: "DELETE",
                        ResourceRecordSet: {
                            Name: req.body.Name,
                            Type: req.body.Type,
                            TTL: req.body.TTL,
                            ResourceRecords: req.body.ResourceRecords
                        }
                    }
                ]
            },
            HostedZoneId: hostedZoneId
        }
        const route53 = new Route53()
        await route53.changeResourceRecordSets(params).promise()
        const records = await route53.listResourceRecordSets({ HostedZoneId: hostedZoneId }).promise()
        return res.json({
            ResourceRecordSets: records.ResourceRecordSets
        });
    }
    catch (err: any) {
        console.log("Error is ", err)
        if (!err.statusCode)
            return res.status(500).json({
                message: "Internal Server Error"
            });
        return res.status(err.statusCode).json({
            message: err.message
        });
    }
})

dnsRecordRouter.post("/create/:hostedZoneId", async (req: Request, res: Response) => {
    const hostedZoneId = req.params.hostedZoneId;

    if (!hostedZoneId)
        return res.status(403).json({
            message: "Invalid Hosted Zone Id"
        });

    try {
        const params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: "CREATE",
                        ResourceRecordSet: {
                            Name: req.body.Name,
                            Type: req.body.Type,
                            TTL: 300,
                            ResourceRecords: req.body.ResourceRecords
                        }
                    }
                ]
            },
            HostedZoneId: hostedZoneId
        };
        const route53 = new Route53();
        await route53.changeResourceRecordSets(params).promise();
        const records = await route53.listResourceRecordSets({ HostedZoneId: hostedZoneId }).promise();

        return res.json({
            ResourceRecordSets: records.ResourceRecordSets
        });
    }
    catch (err: any) {
        console.log("Error is ", err);

        if (!err.statusCode)
            return res.status(500).json({
                message: "Internal Server Error"
            });

        return res.status(err.statusCode).json({
            message: err.message
        });
    }
});

dnsRecordRouter.post("/update/:hostedZoneId", async (req: Request, res: Response) => {
    const hostedZoneId = req.params.hostedZoneId;

    if (!hostedZoneId)
        return res.status(403).json({
            message: "Invalid Hosted Zone Id"
        });
    console.log("Request is ", req.body)

    try {
        const params = {
            ChangeBatch: {
                Changes: [
                    {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: req.body.Name,
                            Type: req.body.Type,
                            TTL: req.body.TTL,
                            ResourceRecords: req.body.ResourceRecords
                        }
                    }
                ]
            },
            HostedZoneId: hostedZoneId
        };
        const route53 = new Route53();
        await route53.changeResourceRecordSets(params).promise();
        const records = await route53.listResourceRecordSets({ HostedZoneId: hostedZoneId }).promise();

        return res.json({
            ResourceRecordSets: records.ResourceRecordSets
        });
    }
    catch (err: any) {
        console.log("Error is ", err);

        if (!err.statusCode)
            return res.status(500).json({
                message: "Internal Server Error"
            });

        return res.status(err.statusCode).json({
            message: err.message
        });
    }
});

dnsRecordRouter.post("/bulk/:hostedZoneId", async (req: Request, res: Response) => {
    const hostedZoneId = req.params.hostedZoneId;
    const data = JSON.parse(req.body.jsonData);
    if (!hostedZoneId)
        return res.status(403).json({
            message: "Invalid Hosted Zone Id"
        });

    if (data.length === 0) {
        return res.status(404).json({
            message: "Some internal error occurred. Please click the Import button again."
        })
    }

    try {
        const domainData = await new Route53().getHostedZone({ Id: hostedZoneId }).promise();
        const domain = domainData.HostedZone.Name.slice(0, -1);
        const params = {
            ChangeBatch: {
                Changes: data.map((record: any) => {
                    return {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: domain,
                            Type: record.Type,
                            TTL: record.TTL,
                            ResourceRecords: [{ Value: record.Value }]
                        }
                    }
                })
            },
            HostedZoneId: hostedZoneId
        };
        const route53 = new Route53();
        await route53.changeResourceRecordSets(params).promise();
        const records = await route53.listResourceRecordSets({ HostedZoneId: hostedZoneId }).promise();

        return res.json({
            ResourceRecordSets: records.ResourceRecordSets
        });
    }
    catch (err: any) {
        console.log("Error is ", err);

        if (!err.statusCode)
            return res.status(500).json({
                message: "Internal Server Error"
            });

        return res.status(err.statusCode).json({
            message: err.message
        });
    }
})

export default dnsRecordRouter