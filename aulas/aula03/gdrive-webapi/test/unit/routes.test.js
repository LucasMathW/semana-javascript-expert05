import { describe, test, expect, jest, beforeEach} from '@jest/globals'
import { logger } from '../../src/logger'
import Routes from '../../src/routes'
import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../util/testUtil'

describe('#Routes test suite', ()=>{

  beforeEach(()=>{
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  const request = TestUtil.gerenateReadbleStream(['some bytes of file'])
  const response = TestUtil.generateWritebleStream(()=>{})
  
  const defaultParams = {
    request: Object.assign(request, {
      Headers: {
        'content-type': 'multpart/form-data'
      },
      method: '',
      body: {}
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn() 
    }),

    values: () => Object.values(defaultParams)
  }

  describe('#setSocketInstance', () => {
    test('#socket shoud store instance io', ()=>{
      const routes = new Routes()
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, emit) => {}
      }
 
      routes.setSocketInstance(ioObj)
      expect(routes.io).toStrictEqual(ioObj)
   })
  })

  describe('#handler', ()=>{

    test('given an inexistent route it shoud show default route', ()=> {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      
      params.request.method = 'inexistent'
      routes.handler(...params.values())
      expect(params.response.end).toHaveBeenCalledWith('hello world')
    })

    test('it shoud set any request with cors enable', ()=> {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      
      params.request.method = 'inexistent'
      routes.handler(...params.values())
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })

    test('given method OPTIONS it shoud chose options route', async ()=> {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      
      params.request.method = 'OPTIONS'
      await routes.handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(204)
    })

    test('given method GET it shoud chose options route', async ()=> {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      
      params.request.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValue()

      await routes.handler(...params.values())
      expect(routes.get).toHaveBeenCalled()
    })

    test('given method POST it shoud chose options route', async ()=> {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }
      
      params.request.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValue()

      await routes.handler(...params.values())
      expect(routes.post).toHaveBeenCalled()
    })
  })

  describe('#GET', ()=> {
    test('given method GET it shoud list all files downloaded', async ()=>{
      
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      const fileStatusesMock = [
        {
          size: '15 kB',
          file: 'file.txt',
          lastModified: '2021-09-15T17:13:23.246Z',
          owner: 'matheus',
        }
      ]

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(fileStatusesMock)

       params.request.method = 'GET'
       await routes.handler(...params.values())
       
       expect(params.response.writeHead).toHaveBeenCalledWith(200)
       expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))
    })  
  })

  describe('#POST', ()=>{
    test('shoud validate POST route workflow', async ()=>{
      const routes = new Routes('/tmp')
      const options = {
        ...defaultParams
      }

      options.request.method = "POST"
      options.request.url = '?socketId=10'

      jest.spyOn(
        UploadHandler.prototype,
        UploadHandler.prototype.registerEventes.name,
        // UploadHandler.prototype.onFile.name
      ).mockImplementation((headers, onFinish) => {
        const writeble = TestUtil.generateWritebleStream(() => {})
        writeble.on('finish', onFinish)

        return writeble
      })

      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEventes).toHaveBeenCalled()
      expect(options.response.writeHead).toHaveBeenCalledWith(200)

      const expectedResult = JSON.stringify({result: 'uploads files with succes!'})
      expect(options.response.end).toHaveBeenCalledWith(expectedResult)
    })  
  })
})