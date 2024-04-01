# Goose

Welcome to Goose, the PostgreSQL table migrator to AWS DynamoDB.

## Getting Started

### AWS CLI

To download and configure the AWS CLI, [click here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

AWS CLI is used to get logged into our AWS testing environment.

To configure the CLI for access, run

```
aws configure
```

From here, you'll need the `Access Key` and `Secret Access Key` for your developer account.

## Starting Local Environment

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
