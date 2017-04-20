'use strict';

function sendUserRes(Container) {
  if (!Container.user.ctx.headerSent && Container.user.ctx.status !== 504) {
    Container.user.ctx.body = Container.proxy.resData;
  }
  return Promise.resolve(Container);
}

module.exports = sendUserRes;
