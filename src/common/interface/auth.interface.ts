import { Request } from 'express';

export interface JwtPayloadInfo {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface OauthUserInfo {
  oauthId: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayloadInfo;
}

export enum AuthGuardType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export interface GetUserInfo {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
}
