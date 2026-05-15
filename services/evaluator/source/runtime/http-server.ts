import { serve } from "@hono/node-server";
import type { Hono } from "hono";

type HttpServerConfiguration = {
  host: string;
  port: number;
};

export function startHttpServer(
  application: Hono,
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
