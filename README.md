# Proposia API

## Pré-requisitos

- Node.js
- Docker
- Docker Compose
- AWS CLI

## Passos para rodar o projeto

1. Clone o repositório:
```bash
git clone https://github.com/weslley-santos/proposia-api.git
```

2. Instale as dependências:
```bash
yarn install
```

3. Inicie o container docker:
```bash
docker-compose up -d
```

4. Crie o bucket S3 local:
```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 aws --endpoint-url=http://localhost:4566 s3 mb s3://proposia-pdfs
```

5. Rode as migrations:
```bash
yarn prisma migrate dev
```

6. Inicie a aplicação:
```bash
yarn start:dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DATABASE_URL="postgresql://admin:admin@localhost:5432/proposals_db?schema=public"

SECURITY_JWT="hggyhjghjhgjghjghjghjjhg"
SECURITY_JWT_REFRESH="nhghjhjgkghjgfhjlmkjjkdijjidrfgiugdrfjdfg"
JWT_EXPIRATION="1d"
JWT_REFRESH_EXPIRATION="7d"

ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="SuperSenha123!"
ADMIN_NAME="Administrador"

AWS_S3_BUCKET_NAME=proposia-pdfs
AWS_S3_REGION=us-east-1
AWS_S3_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
PORT=3000
```