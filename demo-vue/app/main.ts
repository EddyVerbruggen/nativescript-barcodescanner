import Vue from 'nativescript-vue';
import App from './components/App.vue';

(<any>Vue).registerElement('BarcodeScanner', () => require('nativescript-barcodescanner').BarcodeScannerView)

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = (TNS_ENV === 'production');

new Vue({
  render: h => h('frame', [h(App)])
}).$start();
