type DataValueType = string | number | object;

export interface SuccessResponse {
  success: boolean;
  data?: DataValueType;
  [key: string]: DataValueType | boolean;
}

export interface FailResponse {
  success: boolean;
  statusCode: number;
  messages: string[];
  detail: string;
}
