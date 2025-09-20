import { Vehicle } from "@prisma/client";
import { FilterOptionsDTO } from "src/common/dto/filter-options.dto";


export class FilterVehicleDTO extends FilterOptionsDTO<Vehicle> {}