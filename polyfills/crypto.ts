import * as ExpoCrypto from "expo-crypto";

// MessageEvent is used by partysocket's cloneEventNode (React Native path)
// but is not available as a global in Hermes
if (typeof (globalThis as any).MessageEvent === "undefined") {
  (globalThis as any).MessageEvent = class MessageEvent extends Event {
    data: any;
    origin: string;
    lastEventId: string;
    source: any;
    ports: any[];
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.data = init.data ?? null;
      this.origin = init.origin ?? "";
      this.lastEventId = init.lastEventId ?? "";
      this.source = init.source ?? null;
      this.ports = init.ports ?? [];
    }
  };
}

// Shimming out crypto to use the expo-crypto module
// Makes sense, but idk, ask claude...
if (typeof (global as any).crypto === "undefined") {
  (global as any).crypto = {
    randomUUID: () => ExpoCrypto.randomUUID(),
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes);
      return array;
    },
  };
}
