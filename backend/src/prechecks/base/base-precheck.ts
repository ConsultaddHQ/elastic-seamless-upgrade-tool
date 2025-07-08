import { PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
export { PrecheckConfig } from "../types/interfaces";

export abstract class BasePrecheck<Config extends PrecheckConfig = PrecheckConfig, Context = any> {
	private readonly config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	async execute(request: PrecheckExecutionRequest<Context>): Promise<void> {
		await this.run(request);
	}

	protected abstract run(request: PrecheckExecutionRequest<Context>): Promise<void>;

	abstract preExecute(request: PrecheckExecutionRequest<Context>): Promise<void>;

	getPrecheckConfig(): Config {
		return this.config;
	}
}
