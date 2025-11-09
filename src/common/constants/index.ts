export const FILE_FOLDER = {
  AVATAR: 'avatars',
  HANDOVER: 'handovers',
};

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const VN_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

export const FREE_PACKAGE_ID = '4c77e07d-d3cd-40ee-9646-5865816bc34c';

export enum RemindStage {
  BEFORE_24H = 'before_24h',
  BEFORE_1H = 'before_1h',
}

export type RemindFlags = Record<RemindStage, boolean>;
