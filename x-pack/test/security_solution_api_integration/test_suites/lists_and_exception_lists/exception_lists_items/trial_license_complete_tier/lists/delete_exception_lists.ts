/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import type { ExceptionListSchema } from '@kbn/securitysolution-io-ts-list-types';
import { EXCEPTION_LIST_URL } from '@kbn/securitysolution-list-constants';
import { getExceptionResponseMockWithoutAutoGeneratedValues } from '@kbn/lists-plugin/common/schemas/response/exception_list_schema.mock';
import {
  getCreateExceptionListMinimalSchemaMock,
  getCreateExceptionListMinimalSchemaMockWithoutId,
} from '@kbn/lists-plugin/common/schemas/request/create_exception_list_schema.mock';

import { deleteAllExceptions, removeExceptionListServerGeneratedProperties } from '../../../utils';

import { FtrProviderContext } from '../../../../../ftr_provider_context';

export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');
  const log = getService('log');
  const utils = getService('securitySolutionUtils');

  describe('@ess @serverless delete_exception_lists', () => {
    describe('delete exception lists', () => {
      afterEach(async () => {
        await deleteAllExceptions(supertest, log);
      });

      it('should delete a single exception list by its list_id', async () => {
        // create an exception list
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        // delete the exception list by its list id
        const { body } = await supertest
          .delete(
            `${EXCEPTION_LIST_URL}?list_id=${getCreateExceptionListMinimalSchemaMock().list_id}`
          )
          .set('kbn-xsrf', 'true')
          .expect(200);

        const bodyToCompare = removeExceptionListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(
          getExceptionResponseMockWithoutAutoGeneratedValues(await utils.getUsername())
        );
      });

      it('should delete a single exception list using an auto generated id', async () => {
        // create an exception list
        const { body: bodyWithCreatedList } = await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMockWithoutId())
          .expect(200);

        // delete that list by its auto-generated id
        const { body } = await supertest
          .delete(`${EXCEPTION_LIST_URL}?id=${bodyWithCreatedList.id}`)
          .set('kbn-xsrf', 'true')
          .expect(200);

        const outputtedList: Partial<ExceptionListSchema> = {
          ...getExceptionResponseMockWithoutAutoGeneratedValues(await utils.getUsername()),
          list_id: body.list_id,
        };
        const bodyToCompare = removeExceptionListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(outputtedList);
      });

      it('should return an error if the id does not exist when trying to delete it', async () => {
        const { body } = await supertest
          .delete(`${EXCEPTION_LIST_URL}?id=c1e1b359-7ac1-4e96-bc81-c683c092436f`)
          .set('kbn-xsrf', 'true')
          .expect(404);

        expect(body).to.eql({
          message: 'exception list id: "c1e1b359-7ac1-4e96-bc81-c683c092436f" does not exist',
          status_code: 404,
        });
      });

      it('should return an error if the list_id does not exist when trying to delete it', async () => {
        const { body } = await supertest
          .delete(`${EXCEPTION_LIST_URL}?list_id=c1e1b359-7ac1-4e96-bc81-c683c092436f`)
          .set('kbn-xsrf', 'true')
          .expect(404);

        expect(body).to.eql({
          message: 'exception list list_id: "c1e1b359-7ac1-4e96-bc81-c683c092436f" does not exist',
          status_code: 404,
        });
      });
    });
  });
};
