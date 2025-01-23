import logger from '../logger/logger';
import Log, { ILog } from '../models/logs.model';

export const addLogs = async (
  clusterId: string,
  nodeId: string,
  timestamp: Date,
  message: string,
) => {
  const res = await Log.create({ clusterId, nodeId, timestamp, message });
  logger.debug(res);
};

export const getLogs = async (
  clusterId: string,
  nodeId: string,
  timestamp: Date | undefined,
): Promise<ILog[]> => {
  try {
    const query: any = { clusterId: clusterId, nodeId: nodeId };
    if (timestamp) {
      query.timestamp = { $gt: timestamp };
    }
    const docs = await Log.find(query);
    return docs;
  } catch (err) {
    logger.error('Failed to get logs', err);
    throw err;
  }
};
