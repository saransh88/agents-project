declare module "mic" {
  interface MicOptions {
    rate: string;
    channels: string;
    bitwidth: string;
    encoding: string;
    fileType: string;
  }

  interface MicInstance {
    getAudioStream(): NodeJS.ReadableStream;
    start(): void;
    stop(): void;
  }

  function mic(options?: MicOptions): MicInstance;

  export = mic;
}
