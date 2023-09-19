import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import {
  AxiosHeaders,
  AxiosRequestConfig,
  Method,
  RawAxiosRequestHeaders,
} from 'axios';
import { map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';

export type MethodsHeaders = Partial<
  {
    [Key in Method as Lowercase<Key>]: AxiosHeaders;
  } & { common: AxiosHeaders }
>;
interface RequestDataParams {
  method: Method;
  url: string;
  config?: AxiosRequestConfig;
  headers?: (RawAxiosRequestHeaders & MethodsHeaders) | AxiosHeaders;
}

@Injectable()
export class RequestService {
  constructor(private httpService: HttpService) {}

  requestData = ({
    method,
    url,
    config = {},
    headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }: RequestDataParams) => {
    const response$ = this.httpService
      .request({
        method,
        url,
        headers,
        ...config,
      })
      .pipe(map((res) => res.data));

    return lastValueFrom(response$);
  };
}
