import { calculatePoints } from '../services/scoring';

describe('calculatePoints', () => {
  describe('exact score (3 points)', () => {
    test('home win exact', () => {
      expect(calculatePoints(2, 1, 2, 1)).toBe(3);
    });

    test('away win exact', () => {
      expect(calculatePoints(1, 2, 1, 2)).toBe(3);
    });

    test('draw exact', () => {
      expect(calculatePoints(0, 0, 0, 0)).toBe(3);
    });
  });

  describe('correct trend + one score matches (2 points)', () => {
    test('home win, home score matches', () => {
      expect(calculatePoints(2, 1, 2, 0)).toBe(2);
    });

    test('home win, away score matches', () => {
      expect(calculatePoints(2, 1, 3, 1)).toBe(2);
    });

    test('away win, away score matches', () => {
      expect(calculatePoints(0, 2, 1, 2)).toBe(2);
    });
  });

  describe('correct trend only (1 point)', () => {
    test('home win, no score matches', () => {
      expect(calculatePoints(2, 1, 3, 0)).toBe(1);
    });

    test('away win, no score matches', () => {
      expect(calculatePoints(0, 2, 1, 3)).toBe(1);
    });

    test('draw, no score matches', () => {
      expect(calculatePoints(1, 1, 2, 2)).toBe(1);
    });
  });

  describe('wrong trend (0 points)', () => {
    test('actual home win, predicted away win', () => {
      expect(calculatePoints(2, 1, 0, 2)).toBe(0);
    });

    test('actual home win, predicted draw', () => {
      expect(calculatePoints(2, 1, 1, 1)).toBe(0);
    });

    test('actual draw, predicted home win', () => {
      expect(calculatePoints(1, 1, 2, 0)).toBe(0);
    });
  });
});
