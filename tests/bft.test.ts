// basic-functionality.tests
import { describe, test, expect, jest } from '@jest/globals';
import axios from 'axios';
import { fetchRecentZkAppTransactions, fetchZkAppTransactionByHash, formatZkAppTransaction } from '../src/helper';
import { beforeEach, afterEach } from 'node:test';

// Mock axios for API tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Core Functionality Tests', () => {
  describe('API Schema Validation', () => {
    const BLOCKBERRY_API_KEY = process.env.BLOCKBERRY_API_KEY;

    beforeEach(() => {
      if (!BLOCKBERRY_API_KEY) {
        console.warn('Warning: BLOCKBERRY_API_KEY not found in .env file, using fallback for tests');
      }
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('fetchZkAppTransactionByHash returns valid schema', async () => {
      const rawResult = await fetchZkAppTransactionByHash('5JuYk2e4NjmXHrRZxrTZsKJhcySYYmu88bMikY1S9SV6HUTaSP9S');
      const formattedResult = formatZkAppTransaction(rawResult);

      expect(rawResult).toMatchObject({
        txHash: expect.any(String),
        blockHeight: expect.any(Number),
        txStatus: expect.any(String),
        timestamp: expect.any(Number),
        fee: expect.any(Number),
        memo: expect.any(String),
        updatedAccounts: expect.any(Array)
      });

      if (rawResult!.updatedAccounts && rawResult!.updatedAccounts.length > 0) {
        expect(rawResult!.updatedAccounts[0]).toMatchObject({
          accountAddress: expect.any(String),
          isZkappAccount: expect.any(Boolean)
        });
        if ('balanceChange' in rawResult!.updatedAccounts[0]) {
          expect(rawResult!.updatedAccounts[0].balanceChange).toEqual(expect.any(Number));
        }
      }

      expect(formattedResult).toContain('Transaction Hash');
      expect(formattedResult).toContain('Block Height');
      expect(formattedResult).toContain('Status');
      expect(formattedResult).toContain('Fee');

      if (formattedResult.includes('Failures')) {
        const failureMatch = formattedResult.match(/Reason: \{([^}]+)\}/g);
        expect(failureMatch).not.toBeNull();
      }
    });

    test('fetchRecentZkAppTransactions returns an array with valid schema', async () => {
      const result = await fetchRecentZkAppTransactions(0, 10, 'ASC', 'AGE', 'B62qm6U5WnixgSjC1dFiywHdbEt97FsMmJ8D4xrZwcQsSFieEF6hrDL');

      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
      
      if (result![0]) {
        expect(result![0]).toMatchObject({
          fee: expect.any(Number),
          memo: expect.any(String)
        });
        if ('txHash' in result![0]) {
          expect(result![0].txHash).toEqual(expect.any(String));
        }
        if ('blockHeight' in result![0]) {
          expect(result![0].blockHeight).toEqual(expect.any(Number));
        }
        if ('txStatus' in result![0]) {
          expect(result![0].txStatus).toEqual(expect.any(String));
        }
        if ('timestamp' in result![0]) {
          expect(result![0].timestamp).toEqual(expect.any(Number));
        }
      }
    });
  });
});
