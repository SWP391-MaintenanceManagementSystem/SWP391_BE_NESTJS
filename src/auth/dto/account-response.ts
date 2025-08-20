import { Expose, Type } from 'class-transformer';
import { AccountDTO } from 'src/account/dto/account.dto';


export class AccountResponseDTO {
    @Expose()
    message: string;

    @Expose()
    @Type(() => AccountDTO)
    data: AccountDTO;

    @Expose()
    status: string;

    constructor(partial: Partial<AccountResponseDTO>) {
        Object.assign(this, partial);
    }
}