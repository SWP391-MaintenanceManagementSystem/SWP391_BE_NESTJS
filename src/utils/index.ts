import * as bcrypt from 'bcryptjs';
import { } from 'date-fns';
import * as ms from 'ms';
import { PaginationResponseDTO } from 'src/common/dto/pagination-response.dto';

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

const convertMStoDate = (duration: ms.StringValue) => {
  const d = ms(duration);
  return new Date(Date.now() + d);
};

function isEmpty(obj: object) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}




export { hashPassword, comparePassword, convertMStoDate, isEmpty };
