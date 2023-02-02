import { ShareServiceClient, StorageSharedKeyCredential } from '@azure/storage-file-share';
import { promises as fs } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const ACCOUNT_NAME = process.env.ACCOUNT_NAME || '';
const ACCOUNT_KEY = process.env.ACCOUNT_KEY || '';
const SHARE_NAME = process.env.SHARE_NAME || 'explorer';
const DIRECTORY_NAME = process.env.DIRECTORY_NAME || 'devnet';
export const folderUpload = '/service-storage/contracts';

const streamToBuffer = async (readableStream: NodeJS.ReadableStream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data: Buffer | string) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
};

const createShareAndDirectory = async () => {
  const sharedKeyCredential = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY);
  const serviceClient = new ShareServiceClient(`https://${ACCOUNT_NAME}.file.core.windows.net`, sharedKeyCredential);
  const shareClient = serviceClient.getShareClient(SHARE_NAME);
  if (!(await shareClient.exists())) {
    await shareClient.create();
  }

  const directoryClient = shareClient.getDirectoryClient(DIRECTORY_NAME);
  if (!(await directoryClient.exists())) {
    await directoryClient.create();
  }

  return {
    serviceClient,
    shareClient,
    directoryClient,
  };
};

export const uploadFile = async (fileName: string, content: string) => {
  const { directoryClient } = await createShareAndDirectory();
  const fileClient = directoryClient.getFileClient(fileName);
  const contentByteLength = Buffer.byteLength(content);
  await fileClient.create(contentByteLength);
  await fileClient.uploadRange(content, 0, contentByteLength);
};

export const downloadFile = async (fileName: string) => {
  const { directoryClient } = await createShareAndDirectory();
  const fileClient = directoryClient.getFileClient(fileName);
  const downloadFileResponse = await fileClient.download(0);

  if (!downloadFileResponse.readableStreamBody) {
    throw new Error('Expected a readable stream, but none was returned.');
  }

  const downloadedContent = (await streamToBuffer(downloadFileResponse.readableStreamBody)).toString();
  await fs.writeFile(`${folderUpload}/${fileName}`, downloadedContent, 'utf8');
};

export const deleteFile = async (fileName: string) => {
  const { directoryClient } = await createShareAndDirectory();
  const fileClient = directoryClient.getFileClient(fileName);
  const res = await fileClient.delete();
  console.log(res);
};
