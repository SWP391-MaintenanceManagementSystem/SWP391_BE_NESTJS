import { AccountWithProfileDTO } from "src/modules/account/dto/account-with-profile.dto";

export type WorkCenter = {
    centerId: string;
    name: string;
}

export class EmployeeWithCenterDTO extends AccountWithProfileDTO {
    workCenters: WorkCenter;
}
