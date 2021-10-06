import { describe, test, expect, jest, beforeAll, afterAll } from '@jest/globals'
import Routes from '../../src/routes'
import FormData from 'form-data'
import TestUtil from '../util/testUtil'
import fs, { fdatasync } from 'fs'
import { logger } from '../../src/logger'
import { tmpdir } from 'os'
import { join } from  'path'

describe('#Routes test suite', ()=>{
  let defaultDownloadsFolder = ''
  
  beforeAll(async ()=> {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
  })

  afterAll(async ()=> {
    console.log('defaultDownloadsFolder', defaultDownloadsFolder)
    await fs.promises.rm(defaultDownloadsFolder, {recursive: true})
  })

  beforeEach(()=>{
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#getFileStatus', ()=> {
    
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, emit) => {}
    }

    test('shoud upload file to the folder', async ()=>{
        
        const filename = 'basicLinuxComands.jpg'
        const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
        const response = TestUtil.generateWritebleStream(() => { })

        const form = new FormData()
        form.append('photo', fileStream)

        const defaultParams = {
          request: Object.assign(form, {
            headers: form.getHeaders(),
            method: 'POST',
            url: '?socketId=10'
          }),

          response: Object.assign(response,{
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn() 
          }),

          values: () => Object.values(defaultParams)
        }

        const routes = new Routes(defaultDownloadsFolder)
        routes.setSocketInstance(ioObj)
        
        const dirBfore = await fs.promises.readdir(defaultDownloadsFolder)
        expect(dirBfore).toEqual([])
        
        await routes.handler(...defaultParams.values())

        const dirAftter = await fs.promises.readdir(defaultDownloadsFolder)
        expect(dirAftter).toEqual([filename])

        expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
        const expectedResult = JSON.stringify({result: 'uploads files with succes!'})
        expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})