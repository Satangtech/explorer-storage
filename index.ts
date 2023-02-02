import express, { Express, Request, Response } from 'express';
import { promises as fs } from 'fs';
import basicAuth from 'express-basic-auth';
import { deleteFile, downloadFile, folderUpload, uploadFile } from './storage';
import { clientRedis, delValue, getKeys, getValue, setValue } from './redis';
import 'dotenv/config';

const storageUsername = process.env.STORAGE_USERNAME || 'admin';
const storagePassword = process.env.STORAGE_PASSWORD || 'Admin123!';
const app: Express = express();
const port = Number(process.env.PORT) || 5555;
const bind = process.env.BIND || '0.0.0.0';

app.use(express.json());
app.use(
  basicAuth({
    users: { [storageUsername]: storagePassword },
  })
);

app.get('/', (req: Request, res: Response) => {
  res.send('Service Storage!');
});

app.get('/contracts/:contractAddress', async (req: Request, res: Response) => {
  const { contractAddress } = req.params;
  const value = await getValue(contractAddress);
  if (value) {
    res.write(value);
    res.end();
  } else {
    try {
      await downloadFile(`${contractAddress}.json`);
      const jsonObj = await fs.readFile(`${folderUpload}/${contractAddress}.json`, 'utf8');
      await fs.unlink(`${folderUpload}/${contractAddress}.json`);
      await setValue(contractAddress, jsonObj);
      res.write(jsonObj);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(404).send(err);
    }
  }
});

app.post('/contracts/:contractAddress', async (req: Request, res: Response) => {
  const { name, version, optimized, code } = req.body;
  const { contractAddress } = req.params;
  const jsonObj = {
    name,
    version,
    optimized,
    code,
  };
  try {
    const content = JSON.stringify(jsonObj);
    await uploadFile(`${contractAddress}.json`, content);
    await setValue(contractAddress, content);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.delete('/contracts/:contractAddress', async (req: Request, res: Response) => {
  const { contractAddress } = req.params;
  try {
    await delValue(contractAddress);
    await deleteFile(`${contractAddress}.json`);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
});

app.get('/cache/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  const result = await getValue(key);
  res.write(result ? result : '{}');
  res.end();
});

app.post('/cache/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  await setValue(key, JSON.stringify(req.body));
  res.sendStatus(201);
});

app.get('/keys', async (req: Request, res: Response) => {
  const result = await getKeys();
  res.send(result);
});

app.listen(port, bind, async () => {
  await clientRedis.connect();
  console.log(`[Redis]: Redis is connected: ${clientRedis.isOpen}`);
  console.log(`[server]: Server is running at ${bind}:${port}`);
});
