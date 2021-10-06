import { describe, test, expect, jest } from '@jest/globals'
import Routes from '../../src/routes'
import fs from 'fs'
import FileHelper from '../../src/fileHelper'

describe('#FileHelp', ()=>{
  describe('#getFileStatus', () => {
    test('#it shoud return file stauses in corret format', async ()=>{
        const statMock = {
            dev: 2053,
            mode: 33204,
            nlink: 1,
            uid: 1000,
            gid: 1000,
            rdev: 0,
            blksize: 4096,
            ino: 2496030,
            size: 14990,
            blocks: 32,
            atimeMs: 1631726007214.451,
            mtimeMs: 1631726003310.454,
            ctimeMs: 1631726003314.454,
            birthtimeMs: 1631726003246.454,
            atime: '2021-09-15T17:13:27.214Z',
            mtime: '2021-09-15T17:13:23.310Z',
            ctime: '2021-09-15T17:13:23.314Z',
            birthtime: '2021-09-15T17:13:23.246Z'
        }

        const mockUser = 'matheus'
        process.env.USER = mockUser
        const fileName = 'file.png'
        
        jest.spyOn(fs.promises, fs.promises.readdir.name)
          .mockResolvedValue([fileName])  
  
        jest.spyOn(fs.promises, fs.promises.stat.name)
          .mockResolvedValue(statMock)

        const result = await FileHelper.getFileStatus("/tmp")
          
        const expectedResult = [
          {
            size: '15 kB',
            file: fileName,
            lastModified: statMock.birthtime,
            owner: 'matheus',
          }
        ]

        expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`)
        expect(result).toMatchObject(expectedResult)
    })
  }) 
})  