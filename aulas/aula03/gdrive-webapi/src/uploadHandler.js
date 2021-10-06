import Busboy from 'busboy'
import {pipeline} from 'stream/promises'
import fs from 'fs'
import { logger } from './logger.js'

export default class UploadHandler {
  constructor({io, socketId, downloadsFolder, messageTimerDelay = 200 }){
    this.io = io
    this.socketId = socketId
    this.downloadsFolder = downloadsFolder
    this.ON_UPLOAD_EVENT = 'file-upload'
    this.messageTimerDelay = messageTimerDelay
  }

  canExecute(lastExecution){
    return (Date.now() - lastExecution) >= this.messageTimerDelay 
  }

  handlerFileBytes(filename){
      this.lastMessageSent = Date.now()

      async function* handleData(source){
        let alreadyProcess = 0
      
        for await (const chunk of source){
          yield chunk
          alreadyProcess += chunk.length
          
          if(!this.canExecute(this.lastMessageSent)){
            continue;
          }

          this.lastMessageSent = Date.now()
          this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, {alreadyProcess, filename})
          logger.info(`file [${filename}] got ${alreadyProcess} bytes to ${this.socketId}`)
        }
      }

      return handleData.bind(this)
  }

  async onFile(fieldname, file, filename){
    const saveTo = `${this.downloadsFolder}/${filename}`
    
    await pipeline(
      file,
      this.handlerFileBytes.apply(this, [filename]),
      fs.createWriteStream(saveTo)
    )

    logger.info(`file [${filename}] finish`)
  }

  registerEventes(headers, onfinish){
    const busboy = new Busboy({headers})
    busboy.on("file", this.onFile.bind(this))
    busboy.on("finish", onfinish)

    return busboy
  }
}