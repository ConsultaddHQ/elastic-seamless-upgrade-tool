import { Client } from '@elastic/elasticsearch';
import {
  BasicAuth,
  ApiKeyAuth,
  BearerAuth,
} from '@elastic/transport/lib/types';

export interface ElasticClusterInfo {
  url: string;
  apiKey?: string;
  username?: string;
  password?: string;
  bearer?: string;
}

export class ElasticClient {
  config: ElasticClusterInfo;

  constructor(config: ElasticClusterInfo) {
    this.config = config;
  }

  getClient() {
    const auth = this.getAuthDetail();
    if (auth) {
      return new Client({
        node: this.config.url,
        auth: this.getAuthDetail(),
        tls: {
          rejectUnauthorized: false, // Disables certificate validation
        },
      });
    } else {
      return new Client({
        node: this.config.url,
        tls: {
          rejectUnauthorized: false, // Disables certificate validation
        },
      });
    }
  }

  getAuthDetail(): BasicAuth | ApiKeyAuth | BearerAuth | undefined {
    if (this.config.apiKey) {
      return { apiKey: this.config.apiKey };
    } else if (this.config.bearer) {
      return { bearer: this.config.bearer };
    } else if (this.config.username && this.config.password) {
      return {
        username: this.config.username,
        password: this.config.password,
      };
    } else {
      return undefined;
    }
  }

  async getClusterhealth() {
    try {
      const res = await this.getClient().cat.health();
      return res;
    } catch (err) {
      console.log(`Failed to get cluster health`, err);
      throw err;
    }
  }
}
