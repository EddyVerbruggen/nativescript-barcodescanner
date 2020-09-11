import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.plugindemo.barcodescanner.vue',
  appResourcesPath: 'app/App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
  name: 'demo-vue',
  version: '1.0.0',
  appPath: 'app',
} as NativeScriptConfig;
