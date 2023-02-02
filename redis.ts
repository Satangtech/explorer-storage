import { createClient } from 'redis';
import 'dotenv/config';

export const clientRedis = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});
clientRedis.on('error', (err) => console.log('Redis Client Error', err));

export const getValue = async (key: string) => {
  const value = await clientRedis.get(key);
  return value;
};

export const setValue = async (key: string, value: string) => {
  await clientRedis.set(key, value);
};

export const getKeys = async () => {
  const result = await clientRedis.keys('*');
  return result;
};

export const delValue = async (key: string) => {
  await clientRedis.del(key);
};
