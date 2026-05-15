import { serve } from "@hono/node-server";

type FetchApplication = {
  fetch: (request: Request) => Response | Promise<Response>;
};

type HttpServerConfiguration = {
  host: string;
  port: number;
};

export function startHttpServer(
  application: FetchApplication,
  configuration: HttpServerConfiguration,
): void {
  serve(
    {
      fetch: application.fetch,
      hostname: configuration.host,
      port: configuration.port,
    },
    (address) => {
      console.log(
        `Evaluator listening on http://${address.address}:${address.port}`,
      );
    },
  );
}
