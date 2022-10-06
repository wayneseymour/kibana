/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import * as E from 'fp-ts/lib/Either'

export class MinLengthValidationError extends Error {
  public _tag: 'PasswordMinLengthValidationError';

  public minLength: number;

  private constructor(minLength: number) {
    super('password fails to meet min length requirement: ${minLength}');
    this._tag = 'PasswordMinLengthValidationError';
    this.minLength = minLength;
  }

  public static of(minLength: number): MinLengthValidationError {
    return new MinLengthValidationError(minLength);
  }
}

export class CapitalLetterMissingValidationError extends Error {
  public _tag: 'PasswordCapitalLetterMissingValidationError';

  private constructor() {
    super(`password is missing a capital letter`);
    this._tag = 'PasswordCapitalLetterMissingValidationError';
  }

  public static of(): CapitalLetterMissingValidationError {
    return new CapitalLetterMissingValidationError();
  }
}

export type PasswordValidationError =
  | MinLengthValidationError
  | CapitalLetterMissingValidationError;

export interface Password {
  _tag: 'Password';
  value: string;
  isHashed: boolean;
}

export function of(value: string): Password {
  return { _tag: 'Password', value, isHashed: false };
}

export function fromHashed(value: string): Password {
  return { _tag: 'Password', value, isHashed: true };
}

export interface PasswordSpecification {
  minLength?: number;
  capitalLetterRequired?: boolean;
}

export function validate({
  minLength = 0,
  capitalLetterRequired = false,
}: PasswordSpecification = {}) {
  return (password: Password): E.Either<PasswordValidationError, Password> => {
    if (password.value.length < minLength) {
      return E.left(MinLengthValidationError.of(minLength));
    }

    if (capitalLetterRequired && !/[A-Z]/.test(password.value)) {
      return E.left(CapitalLetterMissingValidationError.of());
    }

    return E.right({ ...password, isValidated: true });
  };
}

export type HashFn = (value: string) => string

export function hash(hashFn: HashFn) {
  return (password: Password): Password => ({
    ...password,
    value: hashFn(password.value),
    isHashed: true,
  })
}
