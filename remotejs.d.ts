declare module 'remotejs' {
    interface RemoteJSOptions {
      server: string;
      room: string;
      inject: boolean;
    }
  
    interface RemoteJS {
      init(options: RemoteJSOptions): void;
    }
  
    const RemoteJS: RemoteJS;
    export default RemoteJS;
  }
  
  