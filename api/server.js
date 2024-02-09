const express = require('express')
const cors = require("cors")
const app = express()
const port = 3000

const {api} = require("./routes/routes.js")

app.use(express.json());
api.use(cors({
    origin: "http://localhost:3000",
}))

app.use("/v1", api)

  
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

