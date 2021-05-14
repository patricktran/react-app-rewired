const prompts = require("prompts");
const getWindowsEncryptionPassword = async () => {
  console.info(
    [
      `A password is required to access the secure certificate authority key`,
      `used for signing certificates.`,
      ``,
      `If this is the first time this has run, then this is to set the password`,
      `for future use.  If any new certificates are signed later, you will need`,
      `to use this same password.`,
      ``,
    ].join(`\n`)
  );
  const results = await prompts({
    type: `password`,
    name: `value`,
    message: `Please enter the CA password`,
    validate: (input) => input.length > 0 || `You must enter a password.`,
  });
  return results.value;
};

// override
module.exports = {
  webpack: function(config, env) {
    return config;
  },

  jest: (config) => {
    return config;
  },

  devServer: async function(configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that would normally have
    // been used to generate the Webpack Development server config - you can use it to create
    // a starting configuration to then modify instead of having to create a config from scratch.

    let ssl;

    if (process.env.HTTPS) {
      try {
        const fs = require("fs");
        const path = require("path");
        const os = require("os");

        console.info(
          `\nSetting up automatic SSL certificate (may require elevated permissions/sudo)\n`
        );

        if ([`linux`, `darwin`].includes(os.platform()) && !process.env.HOME) {
          // this is a total hack to ensure process.env.HOME is set on linux and mac
          // devcert creates config path at import time (hence we import devcert after setting dummy value):
          // - https://github.com/davewasmer/devcert/blob/2b1b8d40eda251616bf74fd69f00ae8222ca1171/src/constants.ts#L15
          // - https://github.com/LinusU/node-application-config-path/blob/ae49ff6748b68b29ec76c00ce4a28ba8e9161d9b/index.js#L13
          // if HOME is not set, we will get:
          // "The "path" argument must be of type s tring. Received type undefined"
          // fatal error. This still likely will result in fatal error, but at least it's not on import time
          const mkdtemp = fs.mkdtempSync(path.join(os.tmpdir(), `home-`));
          process.env.HOME = mkdtemp;
        }
        
        const getDevCert = require(`devcert`).certificateFor;

        ssl = await getDevCert("localhost", {
          getCaPath: true,
          skipCertutilInstall: false,
          skipHostsFile: true,
          ui: {
            getWindowsEncryptionPassword,
          },
        });

        if (ssl.caPath) {
          process.env.NODE_EXTRA_CA_CERTS = ssl.caPath;
        }
      } catch (error) {
        console.error(`\nFailed to generate dev SSL certificate - ${error.message}`);
        throw error;
      }
    }

    return function(proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);
      // Change the https certificate options to match your certificate, using the .env file to
      // set the file paths & passphrase.

      if (process.env.HTTPS && ssl) {
        config.https = {
          key: ssl.key,
          cert: ssl.cert,
        };
      }

      // Return your customized Webpack Development Server config.
      return config;
    };
  },

  paths: (paths, env) => {
    return paths;
  },
};
