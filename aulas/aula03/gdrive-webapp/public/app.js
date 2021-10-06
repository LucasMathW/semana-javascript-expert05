import AppController from "./src/appController.js";
import ConnectinManager from "./src/connectionManager.js";
import ViewManager from  './src/viewManager.js';

const API_URL = 'https://127.0.0.1:3000'

const appControler = new AppController({
  connectionManager: new ConnectinManager({
    apiUrl: API_URL,
  }),
  viewManager: new ViewManager(),
})

try{
  await appControler.initialize()
}catch(error){
  console.log('error on initialize', error)
}