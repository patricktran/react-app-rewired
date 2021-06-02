[![NPM](https://img.shields.io/npm/v/@zero-one/react-app-rewired.svg)](https://www.npmjs.com/package/@zero-one/react-app-rewired) 

> ℹ️
This repo is a **fork** of https://github.com/timarney/react-app-rewired. It supports **async/await** for the **devServer** configuration. See test/react-app.

Pending PR: https://github.com/timarney/react-app-rewired/pull/543

```
module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function(config, env) {
    // ...add your webpack config
    return config;
  },
  // The function to use to create a webpack dev server configuration when running the development
  // server with 'npm run start' or 'yarn start'.
  devServer: async configFunction => {

    //call your awaitable methods here
    const result = await Promise.resolve('do something async');
    console.log(result);

    return (proxy, allowedHost) => {
      const config = configFunction(proxy, allowedHost);
      //do something with the result 
      return config;
    }
  }
}
```
