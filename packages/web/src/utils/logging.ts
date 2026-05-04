import isError from 'lodash-es/isError';
import isString from 'lodash-es/isString';

export const resolveErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  if (isString(error)) {
    return error;
  }
  return 'Unknown error';
};
