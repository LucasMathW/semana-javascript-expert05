import fs from 'fs'
import prettyBytes from 'pretty-bytes'

export default class FileHelper {
  static async getFileStatus(downloadsFolder){
   const currentFiles = await fs.promises.readdir(downloadsFolder)
   const statuses = await Promise
      .all(
        currentFiles
          .map(
            file => fs.promises.stat(`${downloadsFolder}/${file}`)
          )
      )
    
    const fileStatuses = []
    for(const indexFile in currentFiles){
      const {birthtime, size} = statuses[indexFile]
      fileStatuses.push({ 
        size: prettyBytes(size),
        file: currentFiles[indexFile],
        lastModified: birthtime,
        owner: process.env.USER
      })
    }
    
    return fileStatuses
  }
} 