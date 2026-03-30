import serverless from 'serverless-http';
import { createExpressApp } from '../../server/app.ts';
import { connectToDatabase } from '../../server/db.ts';

const app = createExpressApp();
const serverlessHandler = serverless(app);

export const handler: any = async (event: any, context: any) => {
  // Ensure DB connection
  await connectToDatabase();
  
  return await serverlessHandler(event, context);
};
