import { PrecheckConfig, PrecheckExecutionRequest } from "../types/interfaces";
export { PrecheckConfig } from "../types/interfaces";

export abstract class BasePrecheck<Config extends PrecheckConfig = PrecheckConfig, Context = any> {
	private readonly config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	abstract schedule(request: PrecheckExecutionRequest<Context>): Promise<void>;

	async execute(request: PrecheckExecutionRequest<Context>): Promise<void> {
		await this.run(request);
	}

	protected abstract run(request: PrecheckExecutionRequest<Context>): Promise<void>;

	protected abstract addLog(request: PrecheckExecutionRequest<Context>, ...logs: string[]): Promise<void>;

	public async shouldRunFor(request: PrecheckExecutionRequest<Context>): Promise<boolean> {
		return true;
	}

	getPrecheckConfig(): Config {
		return this.config;
	}
}
