import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import userRouter from "./user"
import dnsDomainRouter from "./dnsDomain"
import dnsRecordRouter from "./dnsRecord"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use("/user", userRouter)
app.use("/domain", dnsDomainRouter)
app.use("/record", dnsRecordRouter)

app.get("/", (req, res) => {
    return res.status(200).json("Health Check");
})

const port = 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})
