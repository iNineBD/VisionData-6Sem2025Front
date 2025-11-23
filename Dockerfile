# Use Node.js 24 Alpine como base
FROM node:24-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos de dependências
COPY package*.json ./

# Instale as dependências
RUN npm ci

# Copie todo o código fonte
COPY . .

# Copie o arquivo .env (será montado pelo docker-compose ou passado manualmente)
COPY .env* ./

# Faça o build da aplicação
RUN npm run build

# Exponha a porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", ".output/server/index.mjs"]