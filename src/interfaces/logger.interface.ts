export enum LoggerType {
  debug,
  info,
  warning,
  error,
  sponsor,
}

export interface LoggerInterface {
  type: LoggerType;
  message: string;
  tag: string;
}
