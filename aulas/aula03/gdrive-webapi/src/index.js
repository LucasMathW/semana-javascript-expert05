import https from 'https'
import http from  'http'
import {Server} from 'socket.io'
import {logger} from './logger.js'
import fs from 'fs'
import Routes from './routes.js'
const PORT = process.env.PORT || 3000

const isProduction = process.env.NODE_ENV === 'production' 
const user = process.env.USER ?? 'system_user' 

const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem')
}

const protocol = isProduction ? http : https
const ssLconfig = isProduction ? {} : localHostSSL

const routes = new Routes()

const server = protocol.createServer(
  ssLconfig,
  routes.handler.bind(routes)
)

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: false
  }
})

routes.setSocketInstance(io)
io.on("connection", (socket) => logger.info(`someone connected: ${socket.id}`))

const startServer =()=> { 
 const protocol = isProduction ? 'http' : 'https'
 const {port, address} = server.address()
 logger.info(`app running at ${protocol}://${address}:${port}`)
}

server.listen(PORT, startServer)