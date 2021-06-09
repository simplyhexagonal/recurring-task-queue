import Queueon from '../src';

const slowTaskHandlers = [];

const errorTaskHandlers = [];

const successTaskHandlers = [];

test('basic', () => {
  expect(typeof Queueon).toBe('function');
});
