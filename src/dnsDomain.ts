import { Request, Response } from "express"
import AWS, { Route53 } from "aws-sdk"
import { createHostedZoneSchema } from "./zod"
import { middleware } from "./middleware"


const express = require("express")
const dnsDomainRouter = express.Router()
dnsDomainRouter.use(middleware)


function MapDomains(result: any) {
    return result.HostedZones.map((zone: any) => {
        return {
            id: zone.Id.split("/")[2],
            name: zone.Name,
            description: zone.Config.Comment,
            resourceRecordSetCount: zone.ResourceRecordSetCount
        }
    })
}
dnsDomainRouter.get("/", async (req: Request, res: Response) => {
    const route53 = new Route53();
    try {
        const result: any = await route53.listHostedZones().promise()
        const domains = MapDomains(result)
        return res.json({
            domains
        })
    } catch (err: any) {
        if (!err.statusCode) return res.status(500).json({
            message: "Internal Server Error", err
        })
        return res.status(err.statusCode).json({
            message: err.message
        })
    }
})

dnsDomainRouter.post("/:hostedZoneId", async (req: Request, res: Response) => {
    const route53 = new Route53();
    const hostedZoneId = req.params.hostedZoneId;
    try {
        const body = req.body;
        const params = {
            Id: hostedZoneId,
            Comment: body.description
        }
        const response = await route53.updateHostedZoneComment(params).promise()
        const result: any = await route53.listHostedZones().promise()
        const domains = MapDomains(result)
        return res.json({
            domains
        })
    } catch (err: any) {
        if (!err.statusCode) return res.status(500).json({
            message: "Internal Server Error", err
        })
        return res.status(err.statusCode).json({
            message: err.message
        })
    }
})





dnsDomainRouter.post("/", async (req: Request, res: Response) => {

    try {
        const body = req.body;
        const isValid = createHostedZoneSchema.safeParse(body);
        if (!isValid.success) {
            return res.status(403).json({
                message: "Invalid Body"
            })
        }
        const params: any = {
            CallerReference: `${Date.now()}`,
            Name: body.domainName,
            HostedZoneConfig: {
                Comment: body.description
            }
        }
        const route53 = new Route53()
        const result = await route53.createHostedZone(params).promise()
        const getAllDomains = await route53.listHostedZones().promise()
        const domains = MapDomains(getAllDomains)

        return res.status(200).json({
            domains
        })
    } catch (err: any) {
        return res.status(err.statusCode).json({
            message: err.message
        })
    }

})

dnsDomainRouter.delete("/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const params: any = {
            Id: id
        }
        const route53 = new Route53();
        const result = await route53.deleteHostedZone(params).promise()
        const getAllDomains = await route53.listHostedZones().promise()
        const domains = MapDomains(getAllDomains)
        return res.status(200).json({
            domains
        })
    } catch (err: any) {
        return res.status(err.statusCode).json({
            message: err.message
        })
    }
})


export default dnsDomainRouter