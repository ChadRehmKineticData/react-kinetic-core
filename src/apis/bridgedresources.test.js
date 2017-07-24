import axios from 'axios';

import { rejectPromiseWith, resolvePromiseWith } from '../test_utils/promises';
import { fetchDocMarkdown } from '../test_utils/docs';
import { bridgedResourceUrl, fetch, count } from './bridgedresources';

// Mock out the bundle object from a dependency.
jest.mock('../core-helpers', () => ({
  bundle: {
    apiLocation: () => 'user/app/api/v1',
    spaceLocation: () => 'user',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('bridged resource api', () => {
  let options;

  beforeEach(() => {
    options = {
      kappSlug: 'kappslug',
      formSlug: 'formslug',
      bridgedResourceName: 'Collection',
    };
  });
  // test('documentation', () => {
  //   const methods = ['fetch', 'count'];

  //   expect.assertions(methods.length);
  //   return fetchDocMarkdown('API.md').then((result) => {
  //     methods.forEach((method) => {
  //       const matches = result.filter(line => line.endsWith(method));
  //       expect(matches).toHaveLength(1);
  //     });
  //   });
  // });

  describe('#bridgedResourceUrl', () => {
    describe('options', () => {
      test('with valid parameters does not throw an exception', () => {
        expect(() => {
          bridgedResourceUrl(options);
        }).not.toThrow();
      });
      test('missing "formSlug" throws an exception', () => {
        delete options.formSlug;

        expect(() => {
          bridgedResourceUrl(options);
        }).toThrow();
      });
      test('missing "bridgedResourceName" throws an exception', () => {
        expect(() => {
          bridgedResourceUrl({ kappSlug: 'kapp', formSlug: 'form' });
        }).toThrow();
      });
    });

    test('normal output', () => {
      expect(bridgedResourceUrl(options)).toBe('user/kappslug/formslug/bridgedResources/Collection');
    });

    test('default the kapp option', () => {
      delete options.kappSlug;
      expect(bridgedResourceUrl(options)).toBe('user/mock-kapp/formslug/bridgedResources/Collection');
    });

    test('with limit option', () => {
      options.limit = 10;
      expect(bridgedResourceUrl(options)).toMatch(/limit=10/);
    });

    test('with offset option', () => {
      options.offset = 10;
      expect(bridgedResourceUrl(options)).toMatch(/offset=10/);
    });

    describe('values option', () => {
      test('with one value', () => {
        options.values = { a: 'b' };
        expect(bridgedResourceUrl(options)).toMatch(/values\[a\]=b/);
      });

      test('with multiple values', () => {
        options.values = { a: 'b', c: 'd' };
        const url = bridgedResourceUrl(options);
        expect(url).toMatch(/values\[a\]=b/);
        expect(url).toMatch(/values\[c\]=d/);
      });
    });

    describe('attributes option', () => {
      test('with one attribute', () => {
        options.attributes = ['a'];
        expect(bridgedResourceUrl(options)).toMatch(/attributes=a/);
      });

      test('with multiple values', () => {
        options.attributes = ['a', 'b'];
        expect(bridgedResourceUrl(options)).toMatch(/attributes=a,b/);
      });
    });
  });

  describe('#count', () => {
    describe('when successful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            count: 2,
          },
        };
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return count(options).then(({ serverError }) => {
          expect(serverError).toBeUndefined();
        });
      });

      test('returns an object with a count', () => {
        expect.assertions(1);
        // eslint-disable-next-line
        return count(options).then(({ count }) => {
          expect(count).toBe(2);
        });
      });
    });
  });
  describe('#fetch', () => {
    describe('when successful', () => {
      describe('multiple records', () => {
        let response;

        beforeEach(() => {
          response = {
            status: 200,
            data: {
              records: {
                fields: ['Field A', 'Field B'],
                records: [['Value A1', 'Value B1'], ['Value A2', 'Value B2']],
                metadata: {
                  size: 2,
                  nextPageToken: null,
                },
              },
            },
          };
          axios.get = resolvePromiseWith(response);
        });

        test('does not return errors', () => {
          expect.assertions(1);
          return fetch(options).then(({ serverError }) => {
            expect(serverError).toBeUndefined();
          });
        });

        test('returns a records object', () => {
          expect.assertions(7);
          return fetch(options).then(({ records }) => {
            expect(records).toBeDefined();
            expect(records).toBeInstanceOf(Array);
            expect(records).toHaveLength(2);
            expect(records[0]).toHaveProperty('Field A', 'Value A1');
            expect(records[0]).toHaveProperty('Field B', 'Value B1');
            expect(records[1]).toHaveProperty('Field A', 'Value A2');
            expect(records[1]).toHaveProperty('Field B', 'Value B2');
          });
        });
      });
      describe('single record', () => {
        let response;
        let bridgedResource;

        beforeEach(() => {
          response = {
            status: 200,
            data: {
              record: {
                attributes: {
                  'Field A': 'Value A',
                  'Field B': 'Value B',
                },
              },
            },
          };
          axios.get = resolvePromiseWith(response);
        });

        test('does not return errors', () => {
          expect.assertions(1);
          return fetch(options).then(({ serverError }) => {
            expect(serverError).toBeUndefined();
          });
        });

        test('returns a record object', () => {
          expect.assertions(3);
          return fetch(options).then(({ record }) => {
            expect(record).toBeDefined();
            expect(record).toHaveProperty('Field A');
            expect(record).toHaveProperty('Field B');
          });
        });
      });
    });
  });
});