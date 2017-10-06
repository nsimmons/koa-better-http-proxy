import * as koa from 'koa';
import * as http from 'http';

declare function koaHttpProxy(host: string, options: koaHttpProxy.IOptions): koa.Middleware;

declare namespace koaHttpProxy {
  export interface IOptions {
    headers?: { [key: string]: any },
    https?: boolean,
    limit?: string,
    parseReqBody?: boolean,
    port?: number,
    preserveHostHdr?: boolean,
    preserveReqSession?: boolean,
    reqAsBuffer?: boolean,
    reqBodyEncoding?: string | null,
    timeout?: number,
    filter?(ctx: koa.Context): boolean,
    proxyReqBodyDecorator?(bodyContent: string, ctx: koa.Context): string | Promise<string>,
    proxyReqOptDecorator?(proxyReqOpts: IRequestOption, ctx: koa.Context): IRequestOption | Promise<IRequestOption>,
    proxyReqPathResolver?(ctx: koa.Context): string | Promise<string>,
    userResDecorator?(proxyRes: http.IncomingMessage, proxyResData: string | Buffer, ctx: koa.Context): string | Buffer | Promise<string> | Promise<Buffer>,
  }

  export interface IRequestOption {
    hostname: string,
    port: number,
    headers: { [key: string]: any },
    method: string,
    path: string,
    bodyContent: string | Buffer,
    params: any,
  }
}

export = koaHttpProxy
