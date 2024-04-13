import z from "zod"

export const createHostedZoneSchema = z.object({
    domainName: z.string(),
    description: z.string().optional()
})

export const signUpBody = z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
    awsKey: z.string(),
    awsSecret: z.string(),
    awsRegion: z.string()
})

export const signInBody = z.object({
    email: z.string(),
    password: z.string()
})


