import { fetch as expoFetch, type FetchRequestInit } from "expo/fetch";
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from "@atcute/identity-resolver";

// expo/fetch provides a proper ReadableStream response body (pipeThrough support).
// The URL-to-string conversion is needed because expo/fetch rejects URL objects.
export const rnFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input instanceof URL ? input.toString() : input;
  return expoFetch(url as string, init as FetchRequestInit) as unknown as Promise<Response>;
};

export function buildActorResolver() {
  const handleResolver = new CompositeHandleResolver({
    methods: {
      dns: new DohJsonHandleResolver({
        dohUrl: "https://mozilla.cloudflare-dns.com/dns-query",
        fetch: rnFetch,
      }),
      http: new WellKnownHandleResolver({ fetch: rnFetch }),
    },
  });

  const didResolver = new CompositeDidDocumentResolver({
    methods: {
      plc: new PlcDidDocumentResolver({ fetch: rnFetch }),
      web: new WebDidDocumentResolver({ fetch: rnFetch }),
    },
  });

  return new LocalActorResolver({
    handleResolver,
    didDocumentResolver: didResolver,
  });
}
