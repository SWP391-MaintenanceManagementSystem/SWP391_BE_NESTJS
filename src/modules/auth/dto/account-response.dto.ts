import { Expose, Type } from 'class-transformer';
import { AccountDTO } from 'src/modules/account/dto/account.dto';

export class AccountResponseDTO {
  @Expose()
  @Type(() => AccountDTO)
  account: AccountDTO;

  @Expose()
  accessToken: string;

  @Expose()
  message: string;
  constructor(partial: Partial<AccountResponseDTO>) {
    Object.assign(this, partial);
  }
}
