import { yes } from '../util';
import { DefapiConfig, Objectx } from '../../types';
import fileManager from './fileManager';
import {
  CONFIG_FILENAME,
  DEFAULT_SRC_PATH,
  defaultConfig,
  PATH__COMMON_DIR,
  PATH_IMPORTED_CONFIG_FILE
} from '../index';
import { FS, Path } from '../depds';

const configManager = {
  getConfig(): DefapiConfig {
    try {
      let configPath = PATH_IMPORTED_CONFIG_FILE;
      if (!fileManager.exists(configPath)) {
        return defaultConfig;
      }

      const config: DefapiConfig = require(configPath) ?? {};

      if (!config.api.baseUri) {
        config.api.baseUri = '';
      }

      return config;
    } catch (e) {
      console.error(e);
      return defaultConfig;
    }
  },

  getSrcPath(): string {
    const config = this.getConfig();
    if (yes(config.project.srcPath)) {
      // Remove leading slash - value in config should be a relative path.
      return config.project.srcPath!.replace(/^\/+/, '');
    }
    return DEFAULT_SRC_PATH;
  },

  getBaseUri(): string {
    const config = this.getConfig();
    if (config.api.baseUri) {
      return config.api.baseUri;
    }

    return '';
  },

  getTitle(): string {
    const config = this.getConfig();
    return config.api.title ?? '';
  },

  getApiRootPath() {
    const config = this.getConfig();
    let rootPath = config.api.rootPath?.trim();
    if (rootPath && rootPath.length) {
      return `/${rootPath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    }
    return '';
  },

  getDefapiRoutePrefix(): string {
    const config = this.getConfig();
    return config.defapi.routePrefix ?? '';
  },

  getApiHeaders(): Objectx {
    const config = this.getConfig();
    return config.api.headers;
  },

  getApiAuthenticationHeaders(): Objectx {
    const config = this.getConfig();
    return config.api.authenticationHeaders;
  },

  processConfig() {
    this.checkConfig();
    this.importConfig();
  },

  checkConfig() {
    const projectRoot = process.cwd();
    let defapiConfigPathInProject = Path.resolve(projectRoot, CONFIG_FILENAME);
    if (!FS.existsSync(defapiConfigPathInProject)) {
      console.warn(
        `${CONFIG_FILENAME} file not found in project root. Run \`defapi init\` to create the file, then restart your project server.`
      );
    }
  },

  /**
   * Copy the file to the defapi project base, to prevent possible out-of-project import errors.
   */
  importConfig() {
    const projectRoot = process.cwd();
    let defapiConfigPathInProject = Path.resolve(projectRoot, CONFIG_FILENAME);

    const name = Path.basename(defapiConfigPathInProject);
    const dest = Path.join(PATH__COMMON_DIR, name);
    try {
      FS.copyFileSync(defapiConfigPathInProject, dest);
    } catch (e) {
      console.error(`[defapi.ERR] Could not copy \`${CONFIG_FILENAME}\``, e);
    }

    if (!fileManager.exists(dest)) {
      console.warn(`[defapi.WARN] Unable to process \`${CONFIG_FILENAME}\``);
    }
  }
};

export default configManager;
