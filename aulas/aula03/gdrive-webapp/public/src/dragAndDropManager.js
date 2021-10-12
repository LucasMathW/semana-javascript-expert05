export default class DragAndDropManager {
  constructor(){
    this.dropArea = document.getElementById('dropArea') 
    this.onDropHandler = () => {}
  }

  initialize({onDropHandler}){
    this.onDropHandler = onDropHandler
    this.disableDrogAndDropEvents()
    this.enableHightAndLight()
    this.enableDrop()
  }

  disableDrogAndDropEvents(){
    const eventes = [
      'dragenter',
      'dragover',
      'dragleave',
      'drop'
    ]

    const preventDefaults = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    eventes.forEach(eventName => {
      this.dropArea.addEventListener(eventName, preventDefaults, false)
      document.body.addEventListener(eventName, preventDefaults, false)
    })
  }

  enableHightAndLight(){
    const events = ['dragenter', 'dragover']

    const hightAndLight = (e) => {
      this.dropArea.classList.add('highlight')
      this.dropArea.classList.add('drop-area')
    }

    events.forEach(eventName => {
      this.dropArea.addEventListener(eventName, hightAndLight, false)
    })
  }

  enableDrop(e){
    
    const drop = (e) =>{
      this.dropArea.classList.remove('drop-area')
      const files = e.dataTransfer.files
      return this.onDropHandler(files)
    }

    this.dropArea.addEventListener('drop', drop, false)
  }

}