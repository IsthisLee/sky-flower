import { Request } from 'express';

export interface JwtPayloadInfo {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface CreateUserInfo {
  oauthId: string;
  nickname: string;
  profileImageId?: number;
}

export interface OauthUserInfo {
  oauthId: string;
  nickname: string;
  oauthProfileUrl?: string;
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
