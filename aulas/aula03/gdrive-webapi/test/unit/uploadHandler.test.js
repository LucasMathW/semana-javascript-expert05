import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import Routes from '../../src/routes'
import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../util/testUtil'
import fs from 'fs'
import {resolve} from 'path'
import {pipeline} from 'stream/promises'
import { markAsUntransferable } from 'worker_threads'
import { logger } from '../../src/logger'

describe('#UploadHandler test suite', ()=>{

  const ioObj = {
    to: (id) => ioObj,
    emit: (event, emit) => {}
  }

  beforeEach(()=>{
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe("#Register events", ()=> { 
    test('shoud call onFile and onFinish functions on Busboy instance', ()=>{
      const uploadHander = new UploadHandler({ io: ioObj, socketId: 'id1' }) 
    
      jest.spyOn(uploadHander, uploadHander.onFile.name)
        .mockResolvedValue()

      const headers = {
        "content-type" : "multipart/form-data; boundary="
      }

      const fn = jest.fn()
      const busboyInstance = uploadHander.registerEventes(headers, fn)

      const readble = TestUtil.gerenateReadbleStream(['chunks', 'from', 'data'])     
      busboyInstance.emit('file', 'fieldfilename', readble, 'filename.txt')

      busboyInstance.listeners("finish")[0].call()

      expect(uploadHander.onFile).toHaveBeenCalled()
      expect(fn).toHaveBeenCalled()
    
    })
  })
  
  describe('#Onfile', ()=> {
    test('given a stream file it save it on disc', async ()=>{
      const chunks = ['Hey', 'Dude']
      const chunks2 = ['I', 'Dont']
      const downloadsFolder = '/temp'
  
      const handler = new UploadHandler({
        io: ioObj,
        socketId: 'id1',
        downloadsFolder: downloadsFolder 
      })
      
      const onTransform = jest.fn()
      jest.spyOn(handler, handler.handlerFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform))
  
      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritebleStream(onData))
  
      const params = {
        fieldname: 'video',
        file: TestUtil.gerenateReadbleStream(chunks),
        filename: 'mockfile.mov'
      }
      
      await handler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())
  
      const expectedFilename = resolve(handler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
    })
  })

  describe('#HandlerFileBytes', ()=>{
    test('shoud call emit function it is transform stream', async ()=>{

      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const handler = new UploadHandler({
        io: ioObj,
        socketId: 'id1'
      })

      jest.spyOn(handler, handler.canExecute.name)
        .mockReturnValueOnce(true)

      const messages = ['hello']
      const readble = TestUtil.gerenateReadbleStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritebleStream(onWrite)

      await pipeline(
        readble,
        handler.handlerFileBytes('filename.txt'),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())

    })

    test('givem a message time delay in 2secs, it shoud emit only message during 3 seconds', async ()=>{
      jest.spyOn(ioObj, ioObj.emit.name)
      

      const day = '2021-07-21 01:01'

      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
      //-> hello chegou
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      // -> segundo hello está fora da janela de tempo
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      // -> world
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:05`)

      TestUtil.mockDateNow(
        [
          onFirstLastMessageSent,
          onFirstCanExecute,
          onSecondUpdateLastMessageSent,
          onSecondCanExecute,
          onThirdCanExecute,
        ]
      )

      const message = ['hello', 'hello', 'world']
      const filename = 'filename.avi'
      const expectMessageSent = 2
      
      const messageTimerDelay = 2000

      const source = TestUtil.gerenateReadbleStream(message)
      
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: 'id01',
        messageTimerDelay      
      })

      await pipeline(
        source,
        uploadHandler.handlerFileBytes(filename)
      )

      expect(ioObj.emit).toHaveBeenCalledTimes(expectMessageSent)

      const [firtsCalls, secondsCalls] = ioObj.emit.mock.calls

      expect(firtsCalls).toEqual([uploadHandler.ON_UPLOAD_EVENT, {alreadyProcess: 'hello'.length, filename}])
      expect(secondsCalls).toEqual([uploadHandler.ON_UPLOAD_EVENT, {alreadyProcess: message.join("").length, filename}])

    })
  })
 
  describe('CanExecute', ()=>{
    test('Sould return true when the time is later the specified delay',()=>{
      const timerDelay = 1000
    
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimerDelay: timerDelay
      })

      const tickNow = TestUtil.getTimeFromDate('2021-09-01 17:21:03')
      TestUtil.mockDateNow([tickNow])
      const tickBefore = TestUtil.getTimeFromDate('2021-09-01 17:21:01')

      const lastExecution = tickBefore

      // const params = Object.values(lastExecution)
       
      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeTruthy()  
  
    })

    test('Sould return false when the time isnt later the specified delay', ()=>{
      const timerDelay = 3000
    
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimerDelay: timerDelay
      })

      const tickNow = TestUtil.getTimeFromDate('2021-09-01 17:21:02')
      TestUtil.mockDateNow([tickNow])
      
      const lastExecution = TestUtil.getTimeFromDate('2021-09-01 17:21:01')

      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeFalsy() 
    })

  })

})