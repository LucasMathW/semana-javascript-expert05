export default class AppController {
  constructor({connectionManager, viewManager, dragAndDropManager}){
    this.connectionManager = connectionManager
    this.viewManager = viewManager
    this.dragAndDropManager = dragAndDropManager

    this.upoadingFiles = new Map()
  }

  async initialize() {
    this.viewManager.configureFileBtnClick()
    this.viewManager.configureModal()
    this.viewManager.configureOnFileChange(this.onFileChange.bind(this))
    this.dragAndDropManager.initialize({
      onDropHandler: this.onFileChange.bind(this)
    })

    this.connectionManager.configureEvents({
      onProgress: this.onProgress.bind(this)
    })

    this.viewManager.updateStatus(0)

    await this.updateCurrentFiles()
  }

  async onProgress({ alreadyProcess, filename }){    
    const file = this.upoadingFiles.get(filename)
    const processedAlready = Math.ceil(alreadyProcess / file.size * 100)
    this.updateProgress(file, processedAlready)
    
    if(processedAlready < 98) return;

    return this.updateCurrentFiles() 
  }

  updateProgress(file, percent){
    const uploadingFiles = this.upoadingFiles
    file.percent = percent

    const total =  [...uploadingFiles.values()]
      .map(({percent}) => percent ?? 0)
      .reduce((total, current) => total + current, 0)

    this.viewManager.updateStatus(total)
  }

  async onFileChange(files){
      this.upoadingFiles.clear()
    this.viewManager.openModal()
    this.viewManager.updateStatus(0)

    const requests = []
    for(const file of files){
      this.upoadingFiles.set(file.name, file)
      requests.push(this.connectionManager.uploadFile(file))
    }

    await Promise.all(requests)
    this.viewManager.updateStatus(100)

    setTimeout(() => this.viewManager.closeModal(), 1000)
    await this.updateCurrentFiles()
  }

  async updateCurrentFiles(){
    const files = await this.connectionManager.currentFiles()
    this.viewManager.updateCurrentFiles(files)
  }
}